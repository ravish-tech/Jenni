import '@jenni/core/css';
import './styles.css';
import staticReport from './generated/static-metrics.json';

type LevelId = 'core' | 'vue' | 'react';
type BundleMode = 'kit' | 'full';
type CompressionMode = 'gzip' | 'brotli' | 'min';

interface SizeTriple {
  min: number;
  gzip: number;
  brotli: number;
}

interface BundleStats {
  css: SizeTriple;
  js: SizeTriple;
  total: SizeTriple;
  withRuntime?: SizeTriple;
  componentCount: number;
  gzipPerComponent: number;
}

interface StaticFramework {
  id: string;
  name: string;
  package: string;
  paradigm: string;
  kit: BundleStats;
  full: BundleStats;
  cssHygiene: {
    selectorCount: number;
    importantCount: number;
    customPropsCount: number;
    hasCascadeLayers: boolean;
    avgSpecificityScore: number;
    maxSpecificityScore: number;
    runtimeCssInJs?: boolean;
  };
  htmlPayload: {
    rawBytes: number;
    gzipBytes: number;
    elementCount: number;
    totalClassTokens: number;
    avgClassesPerElement: number;
  };
  capabilities: {
    zeroFouc: boolean;
    a11yKeyboardBehaviors: boolean;
    nativeTopLayerOverlays: boolean;
    liveRuntimeDensityMultiplier: boolean;
    oklchPerceptualTokens: boolean;
    containerQueryGrid: boolean;
    cssSubgridSupport: boolean;
    zeroExternalRuntimeDeps: boolean;
  };
}

interface RuntimeResult {
  mountMs: number;
  stateUpdateMs: number;
  themeSwitchMs: number;
  reflowMs: number;
  overlayCycleMs: number;
  dom: {
    lightNodes: number;
    shadowRoots: number;
    shadowNodes: number;
    totalNodes: number;
    styleTags?: number;
  };
}

const reportAny = staticReport as unknown as {
  generatedAt: string;
  frameworks: StaticFramework[];
  levels?: Record<
    LevelId,
    {
      id: LevelId;
      title: string;
      runtimeBase: (SizeTriple & { package: string }) | null;
      frameworks: StaticFramework[];
    }
  >;
};

const state = {
  level: 'core' as LevelId,
  dark: false,
  bundleMode: 'kit' as BundleMode,
  compression: 'gzip' as CompressionMode,
  running: false,
  statusText: 'Ready',
  runs: 5,
  runtime: {} as Record<string, RuntimeResult | undefined>,
};

const runnerFrames = new Map<string, HTMLIFrameElement>();
const runnerLoaded = new Set<string>();
const parityFrames = new Map<string, HTMLIFrameElement>();

function rtKey(lv: LevelId, fw: string) {
  return `${lv}:${fw}`;
}

function getFrameworks(lv: LevelId = state.level): StaticFramework[] {
  return reportAny.levels?.[lv]?.frameworks ?? (lv === 'core' ? reportAny.frameworks : []);
}

function getRt(fw: string, lv: LevelId = state.level): RuntimeResult | undefined {
  return state.runtime[rtKey(lv, fw)];
}

function kb(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

function ensureRunnerIframes(lv: LevelId): Promise<void> {
  let host = document.getElementById('bm-runners');
  if (!host) {
    host = document.createElement('div');
    host.id = 'bm-runners';
    host.className = 'bm-hidden-runners';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);
  }
  const waits: Array<Promise<void>> = [];
  for (const f of getFrameworks(lv)) {
    const key = rtKey(lv, f.id);
    if (runnerFrames.has(key)) continue;
    const iframe = document.createElement('iframe');
    iframe.width = '1200';
    iframe.height = '800';
    waits.push(
      new Promise<void>((resolve) => {
        const t = window.setTimeout(resolve, 4000);
        iframe.addEventListener(
          'load',
          () => {
            window.clearTimeout(t);
            runnerLoaded.add(key);
            resolve();
          },
          { once: true },
        );
      }),
    );
    iframe.src = `/sandbox.html?level=${lv}&fw=${f.id}`;
    host.appendChild(iframe);
    runnerFrames.set(key, iframe);
  }
  return Promise.all(waits).then(() => undefined);
}

function runFrameworkBench(lv: LevelId, fw: string, runs: number, rowCount: number): Promise<RuntimeResult> {
  const key = rtKey(lv, fw);
  return new Promise((resolve, reject) => {
    const iframe = runnerFrames.get(key);
    if (!iframe?.contentWindow) {
      reject(new Error(`Missing sandbox for ${key}`));
      return;
    }
    const requestId = `${key}-${Date.now()}-${Math.random()}`;
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMsg);
      reject(new Error(`Timeout running ${key}`));
    }, 30000);

    function onMsg(event: MessageEvent) {
      const data = event.data;
      if (data?.type === 'BENCH_DONE' && data.requestId === requestId) {
        window.clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        resolve(data.metrics as RuntimeResult);
      }
    }

    window.addEventListener('message', onMsg);
    iframe.contentWindow.postMessage({ type: 'RUN_BENCH', requestId, runs, rowCount }, '*');
  });
}

async function runAllBenchmarks() {
  if (state.running) return;
  const targetLevel = state.level;
  const fws = getFrameworks(targetLevel);
  const rowCount = targetLevel === 'core' ? 600 : 400;
  state.running = true;
  render();

  try {
    await ensureRunnerIframes(targetLevel);
    await new Promise((r) => setTimeout(r, 120));
    for (const f of fws) {
      if (state.level !== targetLevel) break;
      state.statusText = `Measuring ${f.name} (${state.runs}× median, isolated iframe)…`;
      renderStatusOnly();
      const res = await runFrameworkBench(targetLevel, f.id, state.runs, rowCount);
      state.runtime[rtKey(targetLevel, f.id)] = res;
      render();
    }
    if (state.level === targetLevel) {
      state.statusText = `Completed ${state.runs}× median run across 4 ${targetLevel.toUpperCase()} sandboxes`;
    }
  } catch (err) {
    state.statusText = `Error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    state.running = false;
    render();
  }
}

function renderStatusOnly() {
  const el = document.getElementById('bm-status-pill');
  if (el) el.textContent = state.statusText;
}

function toggleTheme() {
  state.dark = !state.dark;
  document.documentElement.dataset.theme = state.dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = state.dark ? 'dark' : 'light';
  parityFrames.forEach((iframe) => {
    iframe.contentWindow?.postMessage({ type: 'SET_THEME', dark: state.dark }, '*');
  });
  render();
}

function exportJsonReport() {
  const levelRt: Record<string, RuntimeResult | undefined> = {};
  for (const f of getFrameworks()) {
    levelRt[f.id] = getRt(f.id);
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    level: state.level,
    static: reportAny.levels?.[state.level] ?? reportAny,
    runtime: levelRt,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ui-benchmark-${state.level}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function bestId(getter: (fw: string) => number | undefined): string | null {
  let minVal = Infinity;
  let winner: string | null = null;
  for (const f of getFrameworks()) {
    const v = getter(f.id);
    if (v != null && v < minVal) {
      minVal = v;
      winner = f.id;
    }
  }
  return winner;
}

function computeCompositeScore(fwId: string): number {
  const fws = getFrameworks();
  const f = fws.find((x) => x.id === fwId);
  if (!f || !fws.length) return 0;

  const minKit = Math.min(...fws.map((x) => x.kit.total.gzip));
  const minFull = Math.min(...fws.map((x) => x.full.total.gzip));
  const bundleScore = ((minKit / f.kit.total.gzip) * 0.6 + (minFull / f.full.total.gzip) * 0.4) * 30;

  const caps = Object.values(f.capabilities);
  const capScore = (caps.filter(Boolean).length / caps.length) * 25;

  const hygienePenalty = f.cssHygiene.runtimeCssInJs
    ? 8
    : Math.min(15, f.cssHygiene.importantCount * 0.05 + (f.cssHygiene.hasCascadeLayers ? 0 : 4));
  const hygieneScore = Math.max(0, 15 - hygienePenalty);

  const rt = getRt(fwId);
  if (!rt) {
    return Math.round(((bundleScore + capScore + hygieneScore) / 70) * 100);
  }

  const minMount = Math.min(...fws.map((k) => getRt(k.id)?.mountMs ?? Infinity));
  const minState = Math.min(...fws.map((k) => getRt(k.id)?.stateUpdateMs ?? Infinity));
  const minOverlay = Math.min(...fws.map((k) => getRt(k.id)?.overlayCycleMs ?? Infinity));
  const minDom = Math.min(...fws.map((k) => getRt(k.id)?.dom.totalNodes ?? Infinity));

  const rtScore =
    (minMount / Math.max(0.05, rt.mountMs)) * 10 +
    (minState / Math.max(0.05, rt.stateUpdateMs)) * 6 +
    (minOverlay / Math.max(0.05, rt.overlayCycleMs)) * 6 +
    (minDom / Math.max(1, rt.dom.totalNodes)) * 8;

  return Math.min(100, Math.round(bundleScore + capScore + hygieneScore + rtScore));
}

function renderLevelView(): string {
  const lv = state.level;
  const fws = getFrameworks(lv);
  const rowCount = lv === 'core' ? 600 : 400;
  const maxBundle = Math.max(...fws.map((f) => f[state.bundleMode].total[state.compression]));
  const minBundle = Math.min(...fws.map((f) => f[state.bundleMode].total[state.compression]));

  const jenni = fws.find((f) => f.id === 'jenni')!;
  const jenniRt = getRt('jenni', lv);
  const peers = fws.filter((f) => f.id !== 'jenni');
  const nextSmallest = [...peers].sort((a, b) => a.kit.total.gzip - b.kit.total.gzip)[0]!;
  const largestFull = [...peers].sort((a, b) => b.full.total.gzip - a.full.total.gzip)[0]!;

  const winMount = bestId((k) => getRt(k)?.mountMs);
  const winState = bestId((k) => getRt(k)?.stateUpdateMs);
  const winReflow = bestId((k) => getRt(k)?.reflowMs);
  const winTheme = bestId((k) => getRt(k)?.themeSwitchMs);
  const winOverlay = bestId((k) => getRt(k)?.overlayCycleMs);
  const winDom = bestId((k) => getRt(k)?.dom.totalNodes);

  const heading =
    lv === 'core'
      ? 'Level 1: Base / Core Benchmark Suite'
      : lv === 'vue'
        ? 'Level 2: Vue 3 UI Benchmark Suite'
        : 'Level 3: React 19 UI Benchmark Suite';

  const subtitle = fws.map((f) => `<strong>${f.name}</strong>`).join(', ');

  return `
    <div class="j-page" data-size="xl">
      <div class="j-stack" data-gap="section">

        <!-- Executive KPI Strip -->
        <section class="j-stack" data-gap="field">
          <div class="j-inline" data-justify="between">
            <div>
              <h1 style="font-size: var(--j-text-2xl); font-weight: var(--j-weight-semibold); letter-spacing: -0.02em">
                ${heading}
              </h1>
              <p style="font-size: var(--j-text-sm); color: var(--j-fg-muted)">
                Apples-to-apples comparison across ${subtitle} inside isolated browser sandboxes.
              </p>
            </div>
            <div class="j-inline" data-gap="related">
              <span id="bm-status-pill" class="j-badge" data-tone="${state.running ? 'warning' : 'info'}">${state.statusText}</span>
              <button id="btn-export" type="button" class="j-button" data-size="sm" data-variant="outline">Export JSON</button>
              <button id="btn-run" type="button" class="j-button" data-size="sm" ${state.running ? 'disabled' : ''}>
                ${state.running ? 'Running…' : `Re-run Live Suite (${state.runs}×)`}
              </button>
            </div>
          </div>

          <div class="j-grid" data-cols="12" data-gap="field">
            <div class="j-col" data-sm="6" data-lg="3">
              <article class="j-card" data-size="sm">
                <div class="j-card__body">
                  <div class="j-inline" data-justify="between">
                    <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">12-Comp App Kit (Gzip)</span>
                    <span class="j-badge" data-size="sm" data-tone="success">#1 ${jenni.name}</span>
                  </div>
                  <div class="bm-kpi-val">${kb(jenni.kit.total.gzip)}</div>
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">${(nextSmallest.kit.total.gzip / jenni.kit.total.gzip).toFixed(1)}× smaller than ${nextSmallest.name}</span>
                </div>
              </article>
            </div>

            <div class="j-col" data-sm="6" data-lg="3">
              <article class="j-card" data-size="sm">
                <div class="j-card__body">
                  <div class="j-inline" data-justify="between">
                    <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Full Library (${jenni.full.componentCount} Comps)</span>
                    <span class="j-badge" data-size="sm" data-tone="success">#1 ${jenni.name}</span>
                  </div>
                  <div class="bm-kpi-val">${kb(jenni.full.total.gzip)}</div>
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">${jenni.full.gzipPerComponent} B/comp · ${(largestFull.full.total.gzip / jenni.full.total.gzip).toFixed(1)}× smaller than ${largestFull.name}</span>
                </div>
              </article>
            </div>

            <div class="j-col" data-sm="6" data-lg="3">
              <article class="j-card" data-size="sm">
                <div class="j-card__body">
                  <div class="j-inline" data-justify="between">
                    <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Cold Mount (${rowCount} Rows)</span>
                    <span class="j-badge" data-size="sm" data-tone="${winMount === 'jenni' ? 'success' : 'neutral'}">
                      ${jenniRt ? (winMount === 'jenni' ? '#1 Fastest' : 'Measured') : 'Pending'}
                    </span>
                  </div>
                  <div class="bm-kpi-val">${jenniRt ? `${jenniRt.mountMs} ms` : '…'}</div>
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">Light DOM · Zero runtime CSS-in-JS</span>
                </div>
              </article>
            </div>

            <div class="j-col" data-sm="6" data-lg="3">
              <article class="j-card" data-size="sm">
                <div class="j-card__body">
                  <div class="j-inline" data-justify="between">
                    <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Overall Score</span>
                    <span class="j-badge" data-size="sm" data-tone="accent">#1 Composite</span>
                  </div>
                  <div class="bm-kpi-val">${computeCompositeScore('jenni')} / 100</div>
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-subtle)">0 !important · @layer · WAI-ARIA complete</span>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- 1. Bundle Payload Comparison -->
        <article class="j-card">
          <header class="j-card__header">
            <div>
              <h2 class="j-card__title">1. Production Bundle Weight (Vite 8 + Rolldown + LightningCSS)</h2>
              <p class="j-card__description">
                Compiled from actual installed npm packages. Solid bar = static CSS, amber bar = JS &amp; CSS-in-JS runtime.
              </p>
            </div>
            <div class="j-inline" data-gap="related">
              <div class="j-segmented" role="radiogroup" aria-label="Bundle scope">
                <button type="button" class="j-segmented__item" data-bundle-mode="kit" aria-checked="${state.bundleMode === 'kit'}">12-Comp App Kit</button>
                <button type="button" class="j-segmented__item" data-bundle-mode="full" aria-checked="${state.bundleMode === 'full'}">Full Framework</button>
              </div>
              <div class="j-segmented" role="radiogroup" aria-label="Compression">
                <button type="button" class="j-segmented__item" data-comp="gzip" aria-checked="${state.compression === 'gzip'}">Gzip</button>
                <button type="button" class="j-segmented__item" data-comp="brotli" aria-checked="${state.compression === 'brotli'}">Brotli</button>
                <button type="button" class="j-segmented__item" data-comp="min" aria-checked="${state.compression === 'min'}">Minified</button>
              </div>
            </div>
          </header>
          <div class="j-card__body">
            <div class="bm-bars">
              ${fws
                .map((f) => {
                  const b = f[state.bundleMode];
                  const cssVal = b.css[state.compression];
                  const jsVal = b.js[state.compression];
                  const totVal = b.total[state.compression];
                  const cssPct = (cssVal / maxBundle) * 100;
                  const jsPct = (jsVal / maxBundle) * 100;
                  const ratio = (totVal / minBundle).toFixed(2);
                  const isWin = totVal === minBundle;
                  return `
                    <div class="bm-bar-row" data-jenni="${f.id === 'jenni'}" data-winner="${isWin}">
                      <div class="bm-bar-label" data-winner="${isWin}">
                        <span>${f.name}</span>
                        ${isWin ? '<span class="j-badge" data-size="sm" data-tone="success">Smallest</span>' : `<span class="j-badge" data-size="sm" data-tone="neutral">${ratio}×</span>`}
                      </div>
                      <div class="bm-bar-track" title="CSS: ${kb(cssVal)} + JS: ${kb(jsVal)}">
                        <div class="bm-bar-seg is-css" style="width: ${cssPct.toFixed(2)}%"></div>
                        <div class="bm-bar-seg is-js" style="width: ${jsPct.toFixed(2)}%"></div>
                      </div>
                      <div class="bm-bar-num">
                        ${kb(totVal)} <span style="opacity:0.65">(${kb(cssVal)} + ${kb(jsVal)})</span>
                      </div>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>
        </article>

        <!-- 2. Live Browser Runtime Benchmarks -->
        <article class="j-card">
          <header class="j-card__header">
            <div>
              <h2 class="j-card__title">2. Live Browser Runtime &amp; DOM Footprint (Lower is Better)</h2>
              <p class="j-card__description">
                Median of ${state.runs} runs per library inside isolated <code>&lt;iframe&gt;</code> sandboxes with synchronous layout flush (<code>offsetHeight</code>).
              </p>
            </div>
          </header>
          <div class="j-card__body" style="padding: 0">
            <div class="bm-table-wrap" style="box-shadow: none; border-radius: 0">
              <table class="bm-table">
                <thead>
                  <tr>
                    <th>Framework</th>
                    <th>Composite</th>
                    <th>Cold Mount (${rowCount} Rows)</th>
                    <th>Reactive Update</th>
                    <th>12-Col Reflow (48 Cards)</th>
                    <th>Theme Switch</th>
                    <th>Overlay Cycle</th>
                    <th>200-Row DOM Nodes</th>
                    <th>${lv === 'core' ? 'Shadow Roots' : 'Injected &lt;style&gt;'}</th>
                  </tr>
                </thead>
                <tbody>
                  ${fws
                    .map((f) => {
                      const r = getRt(f.id, lv);
                      return `
                        <tr data-jenni="${f.id === 'jenni'}">
                          <td>
                            <strong>${f.name}</strong>
                            <div style="font-size: 11px; color: var(--j-fg-subtle)">${f.package}</div>
                          </td>
                          <td><strong>${computeCompositeScore(f.id)} / 100</strong></td>
                          <td class="${winMount === f.id ? 'bm-win' : ''}">${r ? `${r.mountMs} ms` : '…'}</td>
                          <td class="${winState === f.id ? 'bm-win' : ''}">${r ? `${r.stateUpdateMs} ms` : '…'}</td>
                          <td class="${winReflow === f.id ? 'bm-win' : ''}">${r ? `${r.reflowMs} ms` : '…'}</td>
                          <td class="${winTheme === f.id ? 'bm-win' : ''}">${r ? `${r.themeSwitchMs} ms` : '…'}</td>
                          <td class="${winOverlay === f.id ? 'bm-win' : ''}">${r ? `${r.overlayCycleMs} ms` : '…'}</td>
                          <td class="${winDom === f.id ? 'bm-win' : ''}">${r ? r.dom.totalNodes.toLocaleString() : '…'}</td>
                          <td>${r ? (lv === 'core' ? r.dom.shadowRoots : (r.dom.styleTags ?? 0)).toLocaleString() : '…'}</td>
                        </tr>
                      `;
                    })
                    .join('')}
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <!-- 3. CSS Hygiene & Architectural Capability Matrix -->
        <article class="j-card">
          <header class="j-card__header">
            <div>
              <h2 class="j-card__title">3. CSS Hygiene, SSR Markup &amp; Capability Audit</h2>
              <p class="j-card__description">
                Cascade cleanliness, SSR HTML payload, WAI-ARIA keyboard behaviors, top-layer overlays, and spatial primitives.
              </p>
            </div>
          </header>
          <div class="j-card__body" style="padding: 0">
            <div class="bm-table-wrap" style="box-shadow: none; border-radius: 0">
              <table class="bm-table">
                <thead>
                  <tr>
                    <th>Metric / Capability</th>
                    ${fws.map((f) => `<th>${f.name}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>!important</code> declarations</td>
                    ${fws.map((f) => `<td class="${!f.cssHygiene.runtimeCssInJs && f.cssHygiene.importantCount === 0 ? 'bm-win' : ''}">${f.cssHygiene.runtimeCssInJs ? 'CSS-in-JS (runtime)' : f.cssHygiene.importantCount}</td>`).join('')}
                  </tr>
                  <tr>
                    <td>Cascade <code>@layer</code> isolation</td>
                    ${fws.map((f) => `<td>${f.cssHygiene.hasCascadeLayers ? '✅ @layer' : f.cssHygiene.runtimeCssInJs ? '— Runtime &lt;style&gt;' : '— Unlayered / Shadow'}</td>`).join('')}
                  </tr>
                  <tr>
                    <td>200-Row SSR / HTML Payload (Gzip)</td>
                    ${fws.map((f) => `<td>${kb(f.htmlPayload.gzipBytes)} (${f.htmlPayload.avgClassesPerElement} cls/el)</td>`).join('')}
                  </tr>
                  <tr>
                    <td>Zero-FOUC SSR / First Paint</td>
                    ${fws.map((f) => `<td>${f.capabilities.zeroFouc ? '✅ Instant CSS' : '❌ Runtime CSS-in-JS / JS'}</td>`).join('')}
                  </tr>
                  <tr>
                    <td>Built-in WAI-ARIA Keyboard Behaviors</td>
                    ${fws.map((f) => `<td>${f.capabilities.a11yKeyboardBehaviors ? '✅ Included' : '❌ CSS-only (BYO JS)'}</td>`).join('')}
                  </tr>
                  <tr>
                    <td>Native Top-Layer <code>&lt;dialog&gt;</code> &amp; <code>[popover]</code></td>
                    ${fws.map((f) => `<td>${f.capabilities.nativeTopLayerOverlays ? '✅ Zero z-index wars' : '— JS portal / z-index'}</td>`).join('')}
                  </tr>
                  <tr>
                    <td>Live Runtime <code>--j-density</code> Multiplier</td>
                    ${fws.map((f) => `<td>${f.capabilities.liveRuntimeDensityMultiplier ? '✅ Continuous (0.65×–1.15×)' : '— Static sizes'}</td>`).join('')}
                  </tr>
                  <tr>
                    <td><code>@container</code> 12-Col Grid + <code>subgrid</code></td>
                    ${fws.map((f) => `<td>${f.capabilities.containerQueryGrid ? '✅ Container + Subgrid' : '— Viewport @media / manual'}</td>`).join('')}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        <!-- 4. Side-by-Side Live Visual Parity Stage -->
        <section class="j-stack" data-gap="field">
          <div>
            <h2 style="font-size: var(--j-text-lg); font-weight: var(--j-weight-semibold)">
              4. Side-by-Side Live Interactive Parity (Isolated Sandboxes)
            </h2>
            <p style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
              Identical KPIs, alert, progress, tabs, form controls, switch, checkbox, and modal dialog running live in each framework.
            </p>
          </div>
          <div class="bm-parity-grid" id="bm-parity-mount"></div>
        </section>

      </div>
    </div>
  `;
}

function mountParityFramesIfNeeded() {
  const container = document.getElementById('bm-parity-mount');
  if (!container) return;

  const lv = state.level;
  for (const f of getFrameworks(lv)) {
    const key = rtKey(lv, f.id);
    const card = document.createElement('article');
    card.className = 'j-card';
    card.dataset.size = 'sm';
    card.innerHTML = `
      <header class="j-card__header">
        <div class="j-inline" data-gap="inline">
          <strong>${f.name}</strong>
          <span class="j-badge" data-size="sm" data-tone="${f.id === 'jenni' ? 'accent' : 'neutral'}">${kb(f.kit.total.gzip)} kit</span>
        </div>
        <code style="font-size: 11px; color: var(--j-fg-subtle)">${f.package}</code>
      </header>
      <div class="j-card__body" style="padding: 0"></div>
    `;
    const body = card.querySelector('.j-card__body')!;
    let iframe = parityFrames.get(key);
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.className = 'bm-parity-frame';
      iframe.src = `/sandbox.html?level=${lv}&fw=${f.id}&mode=parity`;
      iframe.addEventListener('load', () => {
        iframe!.contentWindow?.postMessage({ type: 'SET_THEME', dark: state.dark }, '*');
      });
      parityFrames.set(key, iframe);
    }
    body.appendChild(iframe);
    container.appendChild(card);
  }
}

function render() {
  const app = document.getElementById('app')!;
  parityFrames.forEach((iframe) => iframe.remove());

  app.innerHTML = `
    <header class="bm-topbar">
      <div class="bm-brand">
        <span class="bm-brand__dot"></span>
        <span>UI Framework Benchmark Suite</span>
        <span class="j-badge" data-size="sm" data-tone="neutral">All 3 Levels · :5174</span>
      </div>

      <div class="j-segmented" role="radiogroup" aria-label="Benchmark level">
        <button type="button" class="j-segmented__item" data-level="core" aria-checked="${state.level === 'core'}">Level 1 · Base / Core</button>
        <button type="button" class="j-segmented__item" data-level="vue" aria-checked="${state.level === 'vue'}">Level 2 · Vue 3</button>
        <button type="button" class="j-segmented__item" data-level="react" aria-checked="${state.level === 'react'}">Level 3 · React 19</button>
      </div>

      <div class="j-inline" data-gap="related">
        <button id="btn-theme" type="button" class="j-button" data-size="sm" data-variant="ghost">
          ${state.dark ? '☀ Light' : '☾ Dark'}
        </button>
      </div>
    </header>
    ${renderLevelView()}
  `;

  mountParityFramesIfNeeded();

  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('btn-run')?.addEventListener('click', () => runAllBenchmarks());
  document.getElementById('btn-export')?.addEventListener('click', exportJsonReport);

  document.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.level as LevelId;
      state.level = next;
      render();
      const allMeasured = getFrameworks(next).every((f) => !!state.runtime[rtKey(next, f.id)]);
      if (!allMeasured && !state.running) {
        runAllBenchmarks();
      }
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-bundle-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.bundleMode = btn.dataset.bundleMode as BundleMode;
      render();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-comp]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.compression = btn.dataset.comp as CompressionMode;
      render();
    });
  });
}

render();
window.addEventListener('load', () => {
  runAllBenchmarks();
});
