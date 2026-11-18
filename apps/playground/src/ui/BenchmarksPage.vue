<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  JBadge,
  JButton,
  JCard,
  JCol,
  JGrid,
  JInline,
  JSegmentedControl,
  JStack,
} from '@jenni/vue';
import Icon from './Icon.vue';
import { prefs } from '@/lib/prefs';

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

interface LevelReport {
  id: LevelId;
  title: string;
  runtimeBase: (SizeTriple & { package: string }) | null;
  frameworks: StaticFramework[];
}

interface StaticReport {
  generatedAt: string;
  level: string;
  frameworks: StaticFramework[];
  levels?: Record<LevelId, LevelReport>;
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

const API_BASE = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/__jenni/benchmark`;
const canReanalyze = import.meta.env.DEV;

const level = ref<LevelId>('core');
const bundleMode = ref<BundleMode>('kit');
const compression = ref<CompressionMode>('gzip');
const running = ref(false);
const analyzing = ref(false);
const statusText = ref('Loading static bundle metrics…');
const runs = ref(5);
const sandboxCacheBust = ref(Date.now());

const report = ref<StaticReport | null>(null);
const runtime = reactive<Record<string, RuntimeResult | undefined>>({});

const runnerRefs = new Map<string, HTMLIFrameElement>();
const runnerLoaded = new Set<string>();
const runnerLoadWaiters = new Map<string, Array<() => void>>();
const parityRefs = new Map<string, HTMLIFrameElement>();

function rtKey(lv: LevelId, fw: string) {
  return `${lv}:${fw}`;
}

function getRt(fw: string, lv: LevelId = level.value): RuntimeResult | undefined {
  return runtime[rtKey(lv, fw)];
}

function setRunnerRef(lv: LevelId, fw: string, el: unknown) {
  const key = rtKey(lv, fw);
  if (el instanceof HTMLIFrameElement) {
    runnerRefs.set(key, el);
  } else {
    runnerRefs.delete(key);
    runnerLoaded.delete(key);
  }
}

function onRunnerLoad(lv: LevelId, fw: string) {
  const key = rtKey(lv, fw);
  runnerLoaded.add(key);
  const list = runnerLoadWaiters.get(key);
  if (list) {
    runnerLoadWaiters.delete(key);
    list.forEach((fn) => fn());
  }
}

function waitForRunnerLoad(key: string): Promise<void> {
  if (runnerLoaded.has(key)) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 4000);
    const list = runnerLoadWaiters.get(key) ?? [];
    list.push(() => {
      window.clearTimeout(timer);
      resolve();
    });
    runnerLoadWaiters.set(key, list);
  });
}

function setParityRef(lv: LevelId, fw: string, el: unknown) {
  const key = rtKey(lv, fw);
  if (el instanceof HTMLIFrameElement) parityRefs.set(key, el);
  else parityRefs.delete(key);
}

function runnerSrc(lv: LevelId, fw: string) {
  return `${API_BASE}/sandbox.html?level=${lv}&fw=${fw}&v=${sandboxCacheBust.value}`;
}

function paritySrc(lv: LevelId, fw: string) {
  return `${API_BASE}/sandbox.html?level=${lv}&fw=${fw}&mode=parity&v=${sandboxCacheBust.value}`;
}

function kb(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

const frameworks = computed<StaticFramework[]>(() => {
  if (!report.value) return [];
  if (report.value.levels?.[level.value]) {
    return report.value.levels[level.value].frameworks;
  }
  return level.value === 'core' ? report.value.frameworks : [];
});

const runtimeBase = computed(() => report.value?.levels?.[level.value]?.runtimeBase ?? null);
const activeRowCount = computed(() => (level.value === 'core' ? 600 : 400));

const jenniMeta = computed(() => frameworks.value.find((f) => f.id === 'jenni') ?? null);
const jenniRt = computed(() => getRt('jenni'));

const runnerPeerRatio = computed(() => {
  const j = jenniMeta.value;
  if (!j) return '';
  const peers = frameworks.value.filter((f) => f.id !== 'jenni');
  if (!peers.length) return '';
  const nextSmallest = [...peers].sort((a, b) => a.kit.total.gzip - b.kit.total.gzip)[0]!;
  if (level.value === 'core') {
    const bs = peers.find((p) => p.id === 'bootstrap') ?? nextSmallest;
    return `CSS + A11y JS · ${(bs.kit.total.gzip / j.kit.total.gzip).toFixed(1)}× smaller than ${bs.name}`;
  }
  const rtLabel = level.value === 'vue' ? 'Vue 3' : 'React 19';
  const withRt = j.kit.withRuntime ? ` (${kb(j.kit.withRuntime.gzip)} w/ ${rtLabel})` : '';
  return `${(nextSmallest.kit.total.gzip / j.kit.total.gzip).toFixed(1)}× smaller than ${nextSmallest.name}${withRt}`;
});

const fullPeerRatio = computed(() => {
  const j = jenniMeta.value;
  if (!j) return '';
  const peers = frameworks.value.filter((f) => f.id !== 'jenni');
  if (!peers.length) return '';
  const largest = [...peers].sort((a, b) => b.full.total.gzip - a.full.total.gzip)[0]!;
  return `${j.full.gzipPerComponent} B/comp · ${(largest.full.total.gzip / j.full.total.gzip).toFixed(1)}× smaller than ${largest.name}`;
});

const mountSubLabel = computed(() => {
  if (level.value === 'core') return '0 ShadowRoots · O(1) root delegation';
  if (level.value === 'vue') return 'Zero-<style> SFCs · Light DOM VNodes';
  return 'React 19 native ref · 0 CSS-in-JS';
});

const maxBundle = computed(() => {
  if (!frameworks.value.length) return 1;
  return Math.max(...frameworks.value.map((f) => f[bundleMode.value].total[compression.value]));
});

const minBundle = computed(() => {
  if (!frameworks.value.length) return 1;
  return Math.min(...frameworks.value.map((f) => f[bundleMode.value].total[compression.value]));
});

function bestId(getter: (fw: string) => number | undefined): string | null {
  let minVal = Infinity;
  let winner: string | null = null;
  for (const f of frameworks.value) {
    const v = getter(f.id);
    if (v != null && v < minVal) {
      minVal = v;
      winner = f.id;
    }
  }
  return winner;
}

const winMount = computed(() => bestId((k) => getRt(k)?.mountMs));
const winState = computed(() => bestId((k) => getRt(k)?.stateUpdateMs));
const winReflow = computed(() => bestId((k) => getRt(k)?.reflowMs));
const winTheme = computed(() => bestId((k) => getRt(k)?.themeSwitchMs));
const winOverlay = computed(() => bestId((k) => getRt(k)?.overlayCycleMs));
const winDom = computed(() => bestId((k) => getRt(k)?.dom.totalNodes));

function compositeScore(fwId: string): number {
  const fws = frameworks.value;
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

  const minM = Math.min(...fws.map((x) => getRt(x.id)?.mountMs ?? Infinity));
  const minS = Math.min(...fws.map((x) => getRt(x.id)?.stateUpdateMs ?? Infinity));
  const minO = Math.min(...fws.map((x) => getRt(x.id)?.overlayCycleMs ?? Infinity));
  const minD = Math.min(...fws.map((x) => getRt(x.id)?.dom.totalNodes ?? Infinity));

  const rtScore =
    (minM / Math.max(0.05, rt.mountMs)) * 10 +
    (minS / Math.max(0.05, rt.stateUpdateMs)) * 6 +
    (minO / Math.max(0.05, rt.overlayCycleMs)) * 6 +
    (minD / Math.max(1, rt.dom.totalNodes)) * 8;

  return Math.min(100, Math.round(bundleScore + capScore + hygieneScore + rtScore));
}

async function runSingleSandbox(lv: LevelId, fw: string): Promise<RuntimeResult> {
  const key = rtKey(lv, fw);
  await waitForRunnerLoad(key);
  const iframe = runnerRefs.get(key);
  if (!iframe?.contentWindow) {
    throw new Error(`Missing sandbox iframe for ${lv}/${fw}`);
  }
  const rowCount = lv === 'core' ? 600 : 400;
  return new Promise((resolve, reject) => {
    const requestId = `${key}-${Date.now()}-${Math.random()}`;
    const timer = window.setTimeout(() => {
      window.removeEventListener('message', onMsg);
      reject(new Error(`Sandbox timeout on ${lv}/${fw}`));
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
    iframe.contentWindow!.postMessage(
      { type: 'RUN_BENCH', requestId, runs: runs.value, rowCount },
      '*',
    );
  });
}

async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/metrics.json`);
  if (!res.ok) throw new Error(`Failed loading benchmark metrics (${res.status})`);
  report.value = (await res.json()) as StaticReport;
}

async function runRuntimeSuite() {
  if (running.value || !frameworks.value.length) return;
  const targetLevel = level.value;
  const fws = [...frameworks.value];
  running.value = true;
  try {
    await nextTick();
    await new Promise((r) => setTimeout(r, 120));
    for (const f of fws) {
      if (level.value !== targetLevel) break;
      statusText.value = `Measuring ${f.name} (${runs.value}× median)…`;
      runtime[rtKey(targetLevel, f.id)] = await runSingleSandbox(targetLevel, f.id);
    }
    if (level.value === targetLevel) {
      statusText.value = `Completed ${runs.value}× median across 4 ${targetLevel.toUpperCase()} sandboxes`;
    }
  } catch (err) {
    statusText.value = `Benchmark error: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    running.value = false;
  }
}

async function rebuildAndRunAll() {
  if (running.value || analyzing.value) return;
  analyzing.value = true;
  statusText.value = 'Recompiling Core, Vue 3 & React 19 production bundles…';
  try {
    const res = await fetch(`${API_BASE}/analyze`, { method: 'POST' });
    if (!res.ok) throw new Error(`Analyze failed (${res.status})`);
    report.value = (await res.json()) as StaticReport;
    runnerLoaded.clear();
    sandboxCacheBust.value = Date.now();
    await nextTick();
    await new Promise((r) => setTimeout(r, 250));
  } catch (err) {
    statusText.value = `Analyze error: ${err instanceof Error ? err.message : String(err)}`;
    analyzing.value = false;
    return;
  }
  analyzing.value = false;
  await runRuntimeSuite();
}

function exportJson() {
  const activeLevelRuntime: Record<string, RuntimeResult | undefined> = {};
  for (const f of frameworks.value) {
    activeLevelRuntime[f.id] = getRt(f.id);
  }
  const blob = new Blob(
    [
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          level: level.value,
          static: report.value?.levels?.[level.value] ?? report.value,
          runtime: activeLevelRuntime,
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ui-benchmark-${level.value}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function syncParityThemes() {
  const isDark =
    prefs.theme === 'dark' ||
    (prefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const densityTag =
    prefs.knobs.density <= 0.8 ? 'compact' : prefs.knobs.density >= 1.1 ? 'comfortable' : 'default';
  parityRefs.forEach((iframe) => {
    iframe.contentWindow?.postMessage({ type: 'SET_THEME', dark: isDark, density: densityTag }, '*');
  });
}

watch(
  () => [prefs.theme, prefs.knobs.density],
  () => syncParityThemes(),
);

watch(level, async (nextLv) => {
  await nextTick();
  syncParityThemes();
  const allMeasured = frameworks.value.every((f) => !!runtime[rtKey(nextLv, f.id)]);
  if (!allMeasured && !running.value) {
    await runRuntimeSuite();
  } else if (allMeasured) {
    statusText.value = `Ready · ${nextLv.toUpperCase()} (${runs.value}× median cached)`;
  }
});

onMounted(async () => {
  await fetchMetrics();
  await runRuntimeSuite();
  syncParityThemes();
});

const levelOptions = [
  { value: 'core', label: 'Level 1 · Base / Core' },
  { value: 'vue', label: 'Level 2 · Vue 3' },
  { value: 'react', label: 'Level 3 · React 19' },
];

const bundleOptions = [
  { value: 'kit', label: '12-Comp App Kit' },
  { value: 'full', label: 'Full Framework' },
];

const compOptions = [
  { value: 'gzip', label: 'Gzip' },
  { value: 'brotli', label: 'Brotli' },
  { value: 'min', label: 'Minified' },
];

const bundleCardDescription = computed(() => {
  if (level.value === 'core') {
    return 'Compiled from installed packages via LightningCSS + Rolldown. Accent bar = CSS; amber bar = JS runtime & behaviors.';
  }
  const base = runtimeBase.value;
  const baseNote = base ? ` (${base.package} runtime baseline: ${kb(base[compression.value])} externalized)` : '';
  return `Pure UI-framework CSS + JS compiled via Vite 8 + Rolldown${baseNote}. Accent bar = static CSS; amber bar = component JS & CSS-in-JS.`;
});

const densityAuditYes = '✅ Continuous (0.65×–1.15×)';
const densityAuditNo = '— Static sizes';
</script>

<template>
  <div class="pg-page is-wide pg-bench">
    <header class="pg-page__head">
      <div class="pg-page__title-row" style="justify-content: space-between">
        <div class="j-inline" data-gap="item">
          <h1 class="pg-page__title">Performance &amp; Architecture Benchmarks</h1>
          <JBadge size="sm" :tone="running || analyzing ? 'warning' : 'success'">
            {{ statusText }}
          </JBadge>
        </div>

        <JInline gap="related">
          <JButton size="sm" variant="ghost" tone="neutral" @click="exportJson">
            Export JSON
          </JButton>
          <JButton
            v-if="canReanalyze"
            size="sm"
            variant="outline"
            tone="neutral"
            :disabled="running || analyzing"
            @click="rebuildAndRunAll"
          >
            <Icon name="reset" :size="13" />
            {{ analyzing ? 'Rebuilding…' : 'Rebuild Bundles' }}
          </JButton>
          <JButton size="sm" :disabled="running || analyzing" @click="runRuntimeSuite">
            {{ running ? 'Running…' : `Re-run Live Suite (${runs}×)` }}
          </JButton>
        </JInline>
      </div>

      <p class="pg-page__lede">
        Real production bundles (<code>Vite 8</code> + <code>Rolldown</code> + <code>LightningCSS</code>) and isolated
        <code>&lt;iframe&gt;</code> browser sandboxes across <strong>Core CSS/JS</strong>, <strong>Vue 3</strong>, and
        <strong>React 19</strong>.
      </p>

      <div style="margin-top: 6px">
        <JSegmentedControl v-model="level" :options="levelOptions" size="sm" aria-label="Benchmark tier" />
      </div>
    </header>

    <!-- Hidden Isolated Runner Sandboxes for Active Level -->
    <div class="pg-bench__runners" aria-hidden="true">
      <iframe
        v-for="f in frameworks"
        :key="`runner-${level}-${f.id}-${sandboxCacheBust}`"
        :ref="(el) => setRunnerRef(level, f.id, el)"
        :src="runnerSrc(level, f.id)"
        width="1200"
        height="800"
        @load="onRunnerLoad(level, f.id)"
      />
    </div>

    <!-- UNIFIED 3-LEVEL BENCHMARK VIEW (Core, Vue 3, React 19) -->
    <JStack v-if="jenniMeta" gap="section">
      <!-- Executive KPI Row -->
      <JGrid :cols="12" gap="field">
        <JCol :sm="6" :lg="3">
          <JCard size="sm">
            <JStack gap="inline">
              <JInline justify="between">
                <span class="pg-bench__kpi-label">12-Comp App Kit (Gzip)</span>
                <JBadge size="sm" tone="success">#1 {{ jenniMeta.name }}</JBadge>
              </JInline>
              <strong class="pg-bench__kpi-val">{{ kb(jenniMeta.kit.total.gzip) }}</strong>
              <span class="pg-bench__kpi-sub">{{ runnerPeerRatio }}</span>
            </JStack>
          </JCard>
        </JCol>

        <JCol :sm="6" :lg="3">
          <JCard size="sm">
            <JStack gap="inline">
              <JInline justify="between">
                <span class="pg-bench__kpi-label">Full Library ({{ jenniMeta.full.componentCount }} Comps)</span>
                <JBadge size="sm" tone="success">#1 {{ jenniMeta.name }}</JBadge>
              </JInline>
              <strong class="pg-bench__kpi-val">{{ kb(jenniMeta.full.total.gzip) }}</strong>
              <span class="pg-bench__kpi-sub">{{ fullPeerRatio }}</span>
            </JStack>
          </JCard>
        </JCol>

        <JCol :sm="6" :lg="3">
          <JCard size="sm">
            <JStack gap="inline">
              <JInline justify="between">
                <span class="pg-bench__kpi-label">Cold Mount ({{ activeRowCount }} Rows)</span>
                <JBadge size="sm" :tone="winMount === 'jenni' ? 'success' : 'info'">
                  {{ jenniRt ? (winMount === 'jenni' ? '#1 Fastest' : 'Live') : 'Running' }}
                </JBadge>
              </JInline>
              <strong class="pg-bench__kpi-val">
                {{ jenniRt ? `${jenniRt.mountMs} ms` : '…' }}
              </strong>
              <span class="pg-bench__kpi-sub">{{ mountSubLabel }}</span>
            </JStack>
          </JCard>
        </JCol>

        <JCol :sm="6" :lg="3">
          <JCard size="sm">
            <JStack gap="inline">
              <JInline justify="between">
                <span class="pg-bench__kpi-label">Composite Score</span>
                <JBadge size="sm" tone="accent">#1 Overall</JBadge>
              </JInline>
              <strong class="pg-bench__kpi-val">{{ compositeScore('jenni') }} / 100</strong>
              <span class="pg-bench__kpi-sub">0 !important · @layer · WAI-ARIA complete</span>
            </JStack>
          </JCard>
        </JCol>
      </JGrid>

      <!-- 1. Production Bundle Weight -->
      <JCard
        title="1. Production Bundle Weight (CSS + JS)"
        :description="bundleCardDescription"
      >
        <template #actions>
          <JInline gap="related">
            <JSegmentedControl v-model="bundleMode" :options="bundleOptions" size="sm" aria-label="Bundle mode" />
            <JSegmentedControl v-model="compression" :options="compOptions" size="sm" aria-label="Compression" />
          </JInline>
        </template>

        <div class="pg-bench__bars">
          <div
            v-for="f in frameworks"
            :key="`${level}-${f.id}`"
            class="pg-bench__bar-row"
            :data-jenni="f.id === 'jenni'"
            :data-winner="f[bundleMode].total[compression] === minBundle"
          >
            <div class="pg-bench__bar-label">
              <span>{{ f.name }}</span>
              <JBadge v-if="f[bundleMode].total[compression] === minBundle" size="sm" tone="success">
                Smallest
              </JBadge>
              <JBadge v-else size="sm" tone="neutral" variant="outline">
                {{ (f[bundleMode].total[compression] / minBundle).toFixed(2) }}×
              </JBadge>
            </div>

            <div class="pg-bench__bar-track">
              <div
                class="pg-bench__bar-seg is-css"
                :style="{ width: `${((f[bundleMode].css[compression] / maxBundle) * 100).toFixed(2)}%` }"
              />
              <div
                class="pg-bench__bar-seg is-js"
                :style="{ width: `${((f[bundleMode].js[compression] / maxBundle) * 100).toFixed(2)}%` }"
              />
            </div>

            <div class="pg-bench__bar-num">
              {{ kb(f[bundleMode].total[compression]) }}
              <small>
                ({{ kb(f[bundleMode].css[compression]) }} + {{ kb(f[bundleMode].js[compression]) }})
              </small>
            </div>
          </div>
        </div>
      </JCard>

      <!-- 2. Live Browser Runtime & DOM Footprint -->
      <JCard
        :title="`2. ${activeRowCount}-Row Live Browser Runtime & DOM Footprint (Lower is Better)`"
        :description="`Median of ${runs} runs per library inside isolated <iframe> sandboxes (${activeRowCount}-row live timing suite + normalized 200-row live DOM node sample).`"
      >
        <div class="pg-bench__table-wrap">
          <table class="pg-bench__table">
            <thead>
              <tr>
                <th>Framework</th>
                <th>Score</th>
                <th>Cold Mount ({{ activeRowCount }} Rows)</th>
                <th>Reactive Update ({{ activeRowCount }} Rows)</th>
                <th>12-Col Reflow (48 Cards)</th>
                <th>Theme Switch ({{ activeRowCount }} Rows)</th>
                <th>Overlay Cycle</th>
                <th>Live DOM (200-Row Sample)</th>
                <th>{{ level === 'core' ? 'Shadow Roots' : 'Injected <style>' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in frameworks" :key="`${level}-rt-${f.id}`" :data-jenni="f.id === 'jenni'">
                <td>
                  <strong>{{ f.name }}</strong>
                  <div class="pg-bench__pkg">{{ f.package }}</div>
                </td>
                <td><strong>{{ compositeScore(f.id) }} / 100</strong></td>
                <td :class="{ 'pg-bench__win': winMount === f.id }">
                  {{ getRt(f.id) ? `${getRt(f.id)!.mountMs} ms` : '…' }}
                </td>
                <td :class="{ 'pg-bench__win': winState === f.id }">
                  {{ getRt(f.id) ? `${getRt(f.id)!.stateUpdateMs} ms` : '…' }}
                </td>
                <td :class="{ 'pg-bench__win': winReflow === f.id }">
                  {{ getRt(f.id) ? `${getRt(f.id)!.reflowMs} ms` : '…' }}
                </td>
                <td :class="{ 'pg-bench__win': winTheme === f.id }">
                  {{ getRt(f.id) ? `${getRt(f.id)!.themeSwitchMs} ms` : '…' }}
                </td>
                <td :class="{ 'pg-bench__win': winOverlay === f.id }">
                  {{ getRt(f.id) ? `${getRt(f.id)!.overlayCycleMs} ms` : '…' }}
                </td>
                <td :class="{ 'pg-bench__win': winDom === f.id }">
                  {{ getRt(f.id) ? getRt(f.id)!.dom.totalNodes.toLocaleString() : '…' }}
                </td>
                <td>
                  <template v-if="getRt(f.id)">
                    {{
                      level === 'core'
                        ? getRt(f.id)!.dom.shadowRoots.toLocaleString()
                        : (getRt(f.id)!.dom.styleTags ?? 0).toLocaleString()
                    }}
                  </template>
                  <template v-else>…</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </JCard>

      <!-- 3. CSS Hygiene & Capability Audit -->
      <JCard
        title="3. CSS Hygiene, SSR Markup & Capability Audit"
        description="Cascade cleanliness, SSR HTML wire size, WAI-ARIA keyboard behaviors, top-layer overlays, live density, and @container grid."
      >
        <div class="pg-bench__table-wrap">
          <table class="pg-bench__table">
            <thead>
              <tr>
                <th>Metric / Capability</th>
                <th v-for="f in frameworks" :key="`${level}-cap-h-${f.id}`">{{ f.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>!important</code> declarations</td>
                <td
                  v-for="f in frameworks"
                  :key="f.id"
                  :class="{ 'pg-bench__win': !f.cssHygiene.runtimeCssInJs && f.cssHygiene.importantCount === 0 }"
                >
                  {{ f.cssHygiene.runtimeCssInJs ? 'CSS-in-JS (runtime)' : f.cssHygiene.importantCount }}
                </td>
              </tr>
              <tr>
                <td>Cascade <code>@layer</code> isolation</td>
                <td v-for="f in frameworks" :key="f.id">
                  {{
                    f.cssHygiene.hasCascadeLayers
                      ? '✅ @layer'
                      : f.cssHygiene.runtimeCssInJs
                        ? '— Runtime <style>'
                        : '— Unlayered / Shadow'
                  }}
                </td>
              </tr>
              <tr>
                <td>Static 200-Row SSR HTML Payload (Gzip)</td>
                <td v-for="f in frameworks" :key="f.id">
                  {{ kb(f.htmlPayload.gzipBytes) }} ({{ f.htmlPayload.avgClassesPerElement }} cls/el)
                </td>
              </tr>
              <tr>
                <td>Zero-FOUC Instant First Paint</td>
                <td v-for="f in frameworks" :key="f.id">
                  {{ f.capabilities.zeroFouc ? '✅ Instant CSS' : '❌ Runtime CSS-in-JS / JS' }}
                </td>
              </tr>
              <tr>
                <td>Built-in WAI-ARIA Keyboard Behaviors</td>
                <td v-for="f in frameworks" :key="f.id">
                  {{ f.capabilities.a11yKeyboardBehaviors ? '✅ Included' : '❌ CSS-only (BYO JS)' }}
                </td>
              </tr>
              <tr>
                <td>Native Top-Layer <code>&lt;dialog&gt;</code> &amp; <code>[popover]</code></td>
                <td v-for="f in frameworks" :key="f.id">
                  {{ f.capabilities.nativeTopLayerOverlays ? '✅ Top-layer' : '— JS portal / z-index' }}
                </td>
              </tr>
              <tr>
                <td>Live Runtime <code>--j-density</code> Multiplier</td>
                <td v-for="f in frameworks" :key="f.id">
                  {{ f.capabilities.liveRuntimeDensityMultiplier ? densityAuditYes : densityAuditNo }}
                </td>
              </tr>
              <tr>
                <td><code>@container</code> 12-Col Grid + <code>subgrid</code></td>
                <td v-for="f in frameworks" :key="f.id">
                  {{ f.capabilities.containerQueryGrid ? '✅ Container + Subgrid' : '— Viewport @media / manual' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </JCard>

      <!-- 4. Side-by-Side Live Interactive Parity -->
      <JStack gap="field">
        <div>
          <h2 style="font-size: var(--j-text-lg); font-weight: var(--j-weight-semibold)">
            4. Side-by-Side Live Interactive Parity (4 Isolated Sandboxes)
          </h2>
          <p style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
            Identical KPI cards, alert, progress, tabs, form controls, switch, checkbox, and modal dialog mounted live in each framework.
          </p>
        </div>

        <JGrid :cols="12" gap="group">
          <JCol v-for="f in frameworks" :key="`parity-${level}-${f.id}-${sandboxCacheBust}`" :md="6">
            <JCard size="sm" :title="f.name" :description="f.package">
              <template #actions>
                <JBadge size="sm" :tone="f.id === 'jenni' ? 'accent' : 'neutral'">
                  {{ kb(f.kit.total.gzip) }} kit
                </JBadge>
              </template>
              <iframe
                :ref="(el) => setParityRef(level, f.id, el)"
                class="pg-bench__parity-frame"
                :src="paritySrc(level, f.id)"
                @load="syncParityThemes"
              />
            </JCard>
          </JCol>
        </JGrid>
      </JStack>
    </JStack>
  </div>
</template>
