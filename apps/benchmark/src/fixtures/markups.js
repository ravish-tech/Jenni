/**
 * Canonical, apples-to-apples HTML fixtures for Level 1 (Base / Core):
 *   - jenni     : jenni-core (Light DOM semantic CSS + @layer + native <dialog>/<popover> + delegated behaviors)
 *   - bootstrap : Bootstrap 5.3 (Component CSS + Bootstrap JS + Popper)
 *   - tailwind  : Tailwind CSS v4 + DaisyUI 5 (Utility + semantic component classes)
 *   - shoelace  : Shoelace 2.20 (Lit + Shadow DOM Web Components + Floating UI)
 *
 * NOTE: Tailwind v4's @tailwindcss/postcss compiler scans this file directly so every utility
 * and DaisyUI class used here is compiled into the Tailwind benchmark bundle automatically.
 */

export const FRAMEWORK_IDS = ['jenni', 'bootstrap', 'tailwind', 'shoelace'];

/**
 * 1. Visual Parity & Interactive Showcase Fixture
 *    Identical product surface: 12-col KPI header, form fields, switch, badges, alert, tabs, dropdown, modal dialog.
 * @param {'jenni' | 'bootstrap' | 'tailwind' | 'shoelace'} fw
 */
export function buildParityHtml(fw) {
  if (fw === 'jenni') {
    return `
      <div class="j-stack" data-gap="field" style="padding: 16px">
        <div class="j-grid" data-cols="12" data-gap="item">
          <div class="j-col" data-sm="4">
            <article class="j-card" data-size="sm">
              <div class="j-card__body">
                <div class="j-inline" data-justify="between">
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">P99 Latency</span>
                  <span class="j-badge" data-size="sm" data-variant="soft" data-tone="success">Healthy</span>
                </div>
                <strong style="font-size: var(--j-text-xl)">11.4 ms</strong>
              </div>
            </article>
          </div>
          <div class="j-col" data-sm="4">
            <article class="j-card" data-size="sm">
              <div class="j-card__body">
                <div class="j-inline" data-justify="between">
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Throughput</span>
                  <span class="j-badge" data-size="sm" data-variant="soft" data-tone="info">+18%</span>
                </div>
                <strong style="font-size: var(--j-text-xl)">48.2k/s</strong>
              </div>
            </article>
          </div>
          <div class="j-col" data-sm="4">
            <article class="j-card" data-size="sm">
              <div class="j-card__body">
                <div class="j-inline" data-justify="between">
                  <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Error Budget</span>
                  <span class="j-badge" data-size="sm" data-variant="outline" data-tone="neutral">99.99%</span>
                </div>
                <strong style="font-size: var(--j-text-xl)">0.01%</strong>
              </div>
            </article>
          </div>
        </div>

        <div class="j-alert" data-tone="info" data-variant="soft" role="status">
          <div class="j-alert__content">
            <div class="j-alert__title">Zero-specificity @layer architecture</div>
            <div class="j-alert__description">Native Light DOM controls render immediately with zero FOUC or ShadowRoot overhead.</div>
          </div>
        </div>

        <article class="j-card">
          <header class="j-card__header">
            <div>
              <h3 class="j-card__title">Deployment Rule</h3>
              <p class="j-card__description">Configure canary rollout and instant rollback.</p>
            </div>
          </header>
          <div class="j-card__body">
            <div class="j-grid" data-cols="12" data-col-gap="group" data-row-gap="field">
              <div class="j-col" data-sm="7">
                <div class="j-field">
                  <label class="j-label" for="j-svc">Service endpoint</label>
                  <input id="j-svc" class="j-input" value="api.acme.dev/v2" />
                </div>
              </div>
              <div class="j-col" data-sm="5">
                <div class="j-field">
                  <label class="j-label" for="j-reg">Primary region</label>
                  <select id="j-reg" class="j-select">
                    <option value="us-west">US West (Oregon)</option>
                    <option value="eu-central">EU Central (Frankfurt)</option>
                    <option value="ap-northeast">AP Northeast (Tokyo)</option>
                  </select>
                </div>
              </div>
            </div>
            <div style="margin-top: 14px">
              <label class="j-choice">
                <input type="checkbox" class="j-switch" role="switch" checked />
                <span class="j-choice__label">Automatic zero-downtime canary promotion</span>
              </label>
            </div>
          </div>
          <footer class="j-card__footer">
            <div class="j-inline" data-gap="related" data-justify="between" style="width: 100%">
              <button type="button" class="j-button" data-variant="outline" data-tone="neutral" popovertarget="j-parity-menu">
                Actions ▾
              </button>
              <div class="j-inline" data-gap="related">
                <button type="button" class="j-button" data-variant="ghost" data-tone="neutral" onclick="document.getElementById('j-parity-dlg').showModal()">
                  Inspect Modal
                </button>
                <button type="button" class="j-button">Deploy release</button>
              </div>
            </div>
          </footer>
        </article>

        <div class="j-menu" id="j-parity-menu" popover role="menu">
          <button class="j-menu__item" role="menuitem">Promote canary</button>
          <button class="j-menu__item" role="menuitem">Drain traffic</button>
          <hr class="j-menu__separator" role="separator" />
          <button class="j-menu__item" role="menuitem" data-tone="danger">Rollback release</button>
        </div>

        <dialog class="j-dialog" id="j-parity-dlg" aria-labelledby="j-dlg-title">
          <div class="j-dialog__panel">
            <header class="j-dialog__header">
              <h2 class="j-dialog__title" id="j-dlg-title">Confirm Canary Promotion</h2>
            </header>
            <div class="j-dialog__body">
              Traffic will shift from 10% to 100% across 3 availability zones.
            </div>
            <footer class="j-dialog__footer">
              <button type="button" class="j-button" data-variant="outline" data-tone="neutral" onclick="this.closest('dialog').close()">Cancel</button>
              <button type="button" class="j-button" onclick="this.closest('dialog').close()">Confirm</button>
            </footer>
          </div>
        </dialog>
      </div>
    `;
  }

  if (fw === 'bootstrap') {
    return `
      <div class="p-3 d-flex flex-column gap-3">
        <div class="row g-2">
          <div class="col-12 col-sm-4">
            <div class="card">
              <div class="card-body py-2 px-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-body-secondary">P99 Latency</small>
                  <span class="badge text-bg-success">Healthy</span>
                </div>
                <strong class="fs-5">11.4 ms</strong>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="card">
              <div class="card-body py-2 px-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-body-secondary">Throughput</small>
                  <span class="badge text-bg-info">+18%</span>
                </div>
                <strong class="fs-5">48.2k/s</strong>
              </div>
            </div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="card">
              <div class="card-body py-2 px-3">
                <div class="d-flex justify-content-between align-items-center mb-1">
                  <small class="text-body-secondary">Error Budget</small>
                  <span class="badge text-bg-secondary">99.99%</span>
                </div>
                <strong class="fs-5">0.01%</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="alert alert-info mb-0 py-2 px-3" role="alert">
          <div class="fw-semibold small">Bootstrap 5.3 Component Stack</div>
          <div class="small">Flexbox negative-margin .row/.col grid + Popper.js runtime positioning.</div>
        </div>

        <div class="card">
          <div class="card-header bg-transparent">
            <h6 class="card-title mb-0">Deployment Rule</h6>
            <small class="text-body-secondary">Configure canary rollout and instant rollback.</small>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-12 col-sm-7">
                <label class="form-label small fw-medium" for="bs-svc">Service endpoint</label>
                <input id="bs-svc" class="form-control form-control-sm" value="api.acme.dev/v2" />
              </div>
              <div class="col-12 col-sm-5">
                <label class="form-label small fw-medium" for="bs-reg">Primary region</label>
                <select id="bs-reg" class="form-select form-select-sm">
                  <option value="us-west">US West (Oregon)</option>
                  <option value="eu-central">EU Central (Frankfurt)</option>
                  <option value="ap-northeast">AP Northeast (Tokyo)</option>
                </select>
              </div>
            </div>
            <div class="form-check form-switch mt-3">
              <input class="form-check-input" type="checkbox" role="switch" id="bs-sw" checked />
              <label class="form-check-label small" for="bs-sw">Automatic zero-downtime canary promotion</label>
            </div>
          </div>
          <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
            <div class="dropdown">
              <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                Actions
              </button>
              <ul class="dropdown-menu">
                <li><button class="dropdown-item" type="button">Promote canary</button></li>
                <li><button class="dropdown-item" type="button">Drain traffic</button></li>
                <li><hr class="dropdown-divider" /></li>
                <li><button class="dropdown-item text-danger" type="button">Rollback release</button></li>
              </ul>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-light btn-sm" data-bs-toggle="modal" data-bs-target="#bs-parity-modal">
                Inspect Modal
              </button>
              <button type="button" class="btn btn-primary btn-sm">Deploy release</button>
            </div>
          </div>
        </div>

        <div class="modal fade" id="bs-parity-modal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h6 class="modal-title">Confirm Canary Promotion</h6>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body small">
                Traffic will shift from 10% to 100% across 3 availability zones.
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary btn-sm" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary btn-sm" data-bs-dismiss="modal">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  if (fw === 'tailwind') {
    return `
      <div class="p-4 flex flex-col gap-4 bg-base-100 text-base-content">
        <div class="grid grid-cols-12 gap-3">
          <div class="col-span-12 sm:col-span-4 card card-border bg-base-100 card-xs">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <span class="text-xs opacity-70">P99 Latency</span>
                <span class="badge badge-soft badge-success badge-sm">Healthy</span>
              </div>
              <strong class="text-xl font-semibold">11.4 ms</strong>
            </div>
          </div>
          <div class="col-span-12 sm:col-span-4 card card-border bg-base-100 card-xs">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <span class="text-xs opacity-70">Throughput</span>
                <span class="badge badge-soft badge-info badge-sm">+18%</span>
              </div>
              <strong class="text-xl font-semibold">48.2k/s</strong>
            </div>
          </div>
          <div class="col-span-12 sm:col-span-4 card card-border bg-base-100 card-xs">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <span class="text-xs opacity-70">Error Budget</span>
                <span class="badge badge-outline badge-sm">99.99%</span>
              </div>
              <strong class="text-xl font-semibold">0.01%</strong>
            </div>
          </div>
        </div>

        <div role="alert" class="alert alert-info alert-soft py-2.5 px-3.5 text-sm">
          <div>
            <div class="font-semibold text-xs">Tailwind v4 + DaisyUI 5</div>
            <div class="text-xs opacity-80">Utility + component classes; no built-in JS keyboard/roving focus behaviors.</div>
          </div>
        </div>

        <div class="card card-border bg-base-100">
          <div class="card-body gap-4">
            <div>
              <h3 class="card-title text-base">Deployment Rule</h3>
              <p class="text-xs opacity-70">Configure canary rollout and instant rollback.</p>
            </div>
            <div class="grid grid-cols-12 gap-4">
              <div class="col-span-12 sm:col-span-7 flex flex-col gap-1.5">
                <label class="label text-xs font-medium" for="tw-svc">Service endpoint</label>
                <input id="tw-svc" class="input input-sm w-full" value="api.acme.dev/v2" />
              </div>
              <div class="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
                <label class="label text-xs font-medium" for="tw-reg">Primary region</label>
                <select id="tw-reg" class="select select-sm w-full">
                  <option value="us-west">US West (Oregon)</option>
                  <option value="eu-central">EU Central (Frankfurt)</option>
                  <option value="ap-northeast">AP Northeast (Tokyo)</option>
                </select>
              </div>
            </div>
            <label class="flex items-center gap-2.5 cursor-pointer text-sm">
              <input type="checkbox" class="toggle toggle-primary toggle-sm" checked />
              <span>Automatic zero-downtime canary promotion</span>
            </label>
            <div class="card-actions justify-between items-center pt-2 border-t border-base-300">
              <div class="dropdown">
                <div tabindex="0" role="button" class="btn btn-outline btn-sm">Actions ▾</div>
                <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-10 w-48 p-2 shadow-sm border border-base-300">
                  <li><a>Promote canary</a></li>
                  <li><a>Drain traffic</a></li>
                  <li><a class="text-error">Rollback release</a></li>
                </ul>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" class="btn btn-ghost btn-sm" onclick="document.getElementById('tw-parity-dlg').showModal()">
                  Inspect Modal
                </button>
                <button type="button" class="btn btn-primary btn-sm">Deploy release</button>
              </div>
            </div>
          </div>
        </div>

        <dialog id="tw-parity-dlg" class="modal">
          <div class="modal-box">
            <h3 class="text-base font-bold">Confirm Canary Promotion</h3>
            <p class="py-3 text-sm opacity-80">Traffic will shift from 10% to 100% across 3 availability zones.</p>
            <div class="modal-action">
              <form method="dialog" class="flex gap-2">
                <button class="btn btn-outline btn-sm">Cancel</button>
                <button class="btn btn-primary btn-sm">Confirm</button>
              </form>
            </div>
          </div>
        </dialog>
      </div>
    `;
  }

  return `
    <div style="padding: 16px; display: flex; flex-direction: column; gap: 16px; font-family: system-ui, sans-serif">
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px">
        <sl-card style="--padding: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">
            <small style="color: #64748b">P99 Latency</small>
            <sl-badge variant="success" pill>Healthy</sl-badge>
          </div>
          <strong style="font-size: 1.2rem">11.4 ms</strong>
        </sl-card>
        <sl-card style="--padding: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">
            <small style="color: #64748b">Throughput</small>
            <sl-badge variant="primary" pill>+18%</sl-badge>
          </div>
          <strong style="font-size: 1.2rem">48.2k/s</strong>
        </sl-card>
        <sl-card style="--padding: 12px">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px">
            <small style="color: #64748b">Error Budget</small>
            <sl-badge variant="neutral" pill>99.99%</sl-badge>
          </div>
          <strong style="font-size: 1.2rem">0.01%</strong>
        </sl-card>
      </div>

      <sl-alert variant="primary" open>
        <strong>Shoelace 2.20 Web Components</strong><br />
        Lit CustomElements + per-element ShadowRoot encapsulation + Floating UI positioning.
      </sl-alert>

      <sl-card>
        <div slot="header">
          <strong>Deployment Rule</strong>
          <div style="font-size: 12px; color: #64748b">Configure canary rollout and instant rollback.</div>
        </div>
        <div style="display: grid; grid-template-columns: 7fr 5fr; gap: 16px">
          <sl-input size="small" label="Service endpoint" value="api.acme.dev/v2"></sl-input>
          <sl-select size="small" label="Primary region" value="us-west">
            <sl-option value="us-west">US West (Oregon)</sl-option>
            <sl-option value="eu-central">EU Central (Frankfurt)</sl-option>
            <sl-option value="ap-northeast">AP Northeast (Tokyo)</sl-option>
          </sl-select>
        </div>
        <div style="margin-top: 14px">
          <sl-switch size="small" checked>Automatic zero-downtime canary promotion</sl-switch>
        </div>
        <div slot="footer" style="display: flex; justify-content: space-between; align-items: center">
          <sl-dropdown>
            <sl-button slot="trigger" size="small" caret>Actions</sl-button>
            <sl-menu>
              <sl-menu-item>Promote canary</sl-menu-item>
              <sl-menu-item>Drain traffic</sl-menu-item>
              <sl-divider></sl-divider>
              <sl-menu-item>Rollback release</sl-menu-item>
            </sl-menu>
          </sl-dropdown>
          <div style="display: flex; gap: 8px">
            <sl-button size="small" variant="text" onclick="document.getElementById('sl-parity-dlg').show()">Inspect Modal</sl-button>
            <sl-button size="small" variant="primary">Deploy release</sl-button>
          </div>
        </div>
      </sl-card>

      <sl-dialog id="sl-parity-dlg" label="Confirm Canary Promotion">
        Traffic will shift from 10% to 100% across 3 availability zones.
        <sl-button slot="footer" size="small" onclick="this.closest('sl-dialog').hide()">Cancel</sl-button>
        <sl-button slot="footer" size="small" variant="primary" onclick="this.closest('sl-dialog').hide()">Confirm</sl-button>
      </sl-dialog>
    </div>
  `;
}

/**
 * 2. High-Volume Interactive Rows Fixture (Cold Mount + Theme Retokenization + Markup/DOM Footprint)
 * @param {'jenni' | 'bootstrap' | 'tailwind' | 'shoelace'} fw
 * @param {number} count
 */
export function buildMountRowsHtml(fw, count = 1000) {
  const parts = new Array(count);

  if (fw === 'jenni') {
    for (let i = 0; i < count; i++) {
      const on = i % 2 === 0 ? ' checked' : '';
      parts[i] = `<div class="j-list-item"><div class="j-list-item__body"><span class="j-list-item__title">Service Node ${i}</span><span class="j-list-item__description">us-west-2 · replica-set</span></div><span class="j-badge" data-size="sm" data-tone="success">Live</span><input type="checkbox" class="j-switch" role="switch" aria-label="Active"${on} /><button type="button" class="j-button" data-size="sm" data-variant="outline">Edit</button><button type="button" class="j-button" data-size="sm">Deploy</button></div>`;
    }
    return `<div class="j-list" data-variant="divided">${parts.join('')}</div>`;
  }

  if (fw === 'bootstrap') {
    for (let i = 0; i < count; i++) {
      const on = i % 2 === 0 ? ' checked' : '';
      parts[i] = `<div class="list-group-item d-flex align-items-center justify-content-between gap-2 py-2 px-3"><div class="me-auto"><div class="fw-medium small">Service Node ${i}</div><div class="text-body-secondary" style="font-size:12px">us-west-2 · replica-set</div></div><span class="badge text-bg-success">Live</span><div class="form-check form-switch mb-0"><input class="form-check-input" type="checkbox" role="switch" aria-label="Active"${on} /></div><button type="button" class="btn btn-outline-secondary btn-sm">Edit</button><button type="button" class="btn btn-primary btn-sm">Deploy</button></div>`;
    }
    return `<div class="list-group list-group-flush">${parts.join('')}</div>`;
  }

  if (fw === 'tailwind') {
    for (let i = 0; i < count; i++) {
      const on = i % 2 === 0 ? ' checked' : '';
      parts[i] = `<div class="flex items-center justify-between gap-3 py-2.5 px-3 border-b border-base-300 bg-base-100 text-base-content"><div class="min-w-0 flex-1"><div class="text-sm font-medium truncate">Service Node ${i}</div><div class="text-xs opacity-60 truncate">us-west-2 · replica-set</div></div><span class="badge badge-soft badge-success badge-sm">Live</span><input type="checkbox" class="toggle toggle-primary toggle-sm" aria-label="Active"${on} /><button type="button" class="btn btn-outline btn-xs">Edit</button><button type="button" class="btn btn-primary btn-xs">Deploy</button></div>`;
    }
    return `<div class="flex flex-col">${parts.join('')}</div>`;
  }

  for (let i = 0; i < count; i++) {
    const on = i % 2 === 0 ? ' checked' : '';
    parts[i] = `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid #e2e8f0"><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:500">Service Node ${i}</div><div style="font-size:12px;color:#64748b">us-west-2 · replica-set</div></div><sl-badge variant="success" pill>Live</sl-badge><sl-switch size="small" aria-label="Active"${on}></sl-switch><sl-button size="small" variant="default">Edit</sl-button><sl-button size="small" variant="primary">Deploy</sl-button></div>`;
  }
  return `<div>${parts.join('')}</div>`;
}

/**
 * 3. 12-Column Responsive Dashboard Reflow Fixture (48 Cards)
 * @param {'jenni' | 'bootstrap' | 'tailwind' | 'shoelace'} fw
 * @param {number} cards
 */
export function buildDashboardGridHtml(fw, cards = 48) {
  const cells = new Array(cards);
  if (fw === 'jenni') {
    for (let i = 0; i < cards; i++) {
      cells[i] = `<div class="j-col" data-sm="6" data-md="4" data-lg="3"><article class="j-card" data-size="sm"><div class="j-card__body"><span class="j-badge" data-size="sm" data-variant="soft">M-${i}</span><strong>99.${i % 99}%</strong></div></article></div>`;
    }
    return `<div class="j-grid" data-cols="12" data-gap="item">${cells.join('')}</div>`;
  }
  if (fw === 'bootstrap') {
    for (let i = 0; i < cards; i++) {
      cells[i] = `<div class="col-12 col-sm-6 col-md-4 col-lg-3"><div class="card"><div class="card-body p-2"><span class="badge text-bg-light">M-${i}</span> <strong>99.${i % 99}%</strong></div></div></div>`;
    }
    return `<div class="container-fluid px-0"><div class="row g-2">${cells.join('')}</div></div>`;
  }
  if (fw === 'tailwind') {
    for (let i = 0; i < cards; i++) {
      cells[i] = `<div class="col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3 card card-border bg-base-100 card-xs"><div class="card-body"><span class="badge badge-soft badge-sm">M-${i}</span><strong>99.${i % 99}%</strong></div></div>`;
    }
    return `<div class="grid grid-cols-12 gap-3">${cells.join('')}</div>`;
  }
  for (let i = 0; i < cards; i++) {
    cells[i] = `<sl-card style="--padding:10px"><sl-badge variant="neutral">M-${i}</sl-badge> <strong>99.${i % 99}%</strong></sl-card>`;
  }
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">${cells.join('')}</div>`;
}

/**
 * 4. Interactive Overlay & Roving Tabs Cycle Fixture
 * @param {'jenni' | 'bootstrap' | 'tailwind' | 'shoelace'} fw
 */
export function buildOverlaySuiteHtml(fw) {
  if (fw === 'jenni') {
    return `
      <div>
        <button id="bench-dlg-trigger" type="button" class="j-button">Open</button>
        <dialog id="bench-dlg" class="j-dialog"><div class="j-dialog__panel"><div class="j-dialog__body">Dialog payload</div></div></dialog>
        <button id="bench-menu-trigger" type="button" class="j-button" popovertarget="bench-menu">Menu</button>
        <div id="bench-menu" class="j-menu" popover role="menu">
          <button class="j-menu__item" role="menuitem">Item 1</button>
          <button class="j-menu__item" role="menuitem">Item 2</button>
          <button class="j-menu__item" role="menuitem">Item 3</button>
        </div>
      </div>
    `;
  }
  if (fw === 'bootstrap') {
    return `
      <div>
        <button id="bench-dlg-trigger" type="button" class="btn btn-primary">Open</button>
        <div class="modal" id="bench-dlg" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-body">Dialog payload</div></div></div></div>
        <div class="dropdown">
          <button id="bench-menu-trigger" class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">Menu</button>
          <ul id="bench-menu" class="dropdown-menu">
            <li><button class="dropdown-item" type="button">Item 1</button></li>
            <li><button class="dropdown-item" type="button">Item 2</button></li>
            <li><button class="dropdown-item" type="button">Item 3</button></li>
          </ul>
        </div>
      </div>
    `;
  }
  if (fw === 'tailwind') {
    return `
      <div>
        <button id="bench-dlg-trigger" type="button" class="btn btn-primary">Open</button>
        <dialog id="bench-dlg" class="modal"><div class="modal-box"><p>Dialog payload</p></div></dialog>
        <details id="bench-menu" class="dropdown">
          <summary id="bench-menu-trigger" class="btn m-1">Menu</summary>
          <ul class="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li><a>Item 1</a></li>
            <li><a>Item 2</a></li>
            <li><a>Item 3</a></li>
          </ul>
        </details>
      </div>
    `;
  }
  return `
    <div>
      <sl-button id="bench-dlg-trigger">Open</sl-button>
      <sl-dialog id="bench-dlg" label="Dialog">Dialog payload</sl-dialog>
      <sl-dropdown id="bench-menu">
        <sl-button id="bench-menu-trigger" slot="trigger" caret>Menu</sl-button>
        <sl-menu>
          <sl-menu-item>Item 1</sl-menu-item>
          <sl-menu-item>Item 2</sl-menu-item>
          <sl-menu-item>Item 3</sl-menu-item>
        </sl-menu>
      </sl-dropdown>
    </div>
  `;
}
