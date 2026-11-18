import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import {
  JAlert,
  JAvatar,
  JBadge,
  JButton,
  JCard,
  JCheckbox,
  JCol,
  JDialog,
  JField,
  JGrid,
  JInline,
  JInput,
  JLabel,
  JList,
  JListItem,
  JProgress,
  JSelect,
  JStack,
  JSwitch,
  JTab,
  JTabList,
  JTabPanel,
  JTabs,
} from 'jenni-vue';

function applyTheme(dark: boolean, density = 'default') {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.documentElement.dataset.density = density || 'default';
}

const REGIONS = [
  { label: 'US West (Oregon)', value: 'us-west' },
  { label: 'EU Central (Frankfurt)', value: 'eu-central' },
  { label: 'AP Northeast (Tokyo)', value: 'ap-northeast' },
];

let activeApp: App | null = null;
function unmountActive() {
  if (activeApp) {
    activeApp.unmount();
    activeApp = null;
  }
}

(window as any).__benchAdapter = {
  mode: 'component',

  setTheme(dark: boolean, density = 'default') {
    applyTheme(dark, density);
  },

  async mountParity(stage: HTMLElement, opts?: { dark?: boolean; density?: string }) {
    unmountActive();
    stage.innerHTML = '';
    if (opts?.dark != null) applyTheme(opts.dark, opts.density);

    const endpoint = ref('api.acme.dev/v2');
    const region = ref('us-west');
    const autoPromote = ref(true);
    const auditLog = ref(true);
    const activeTab = ref('canary');
    const dlgOpen = ref(false);

    const ParityApp = defineComponent({
      setup() {
        return () =>
          h(JStack, { gap: 'field', style: { padding: '16px' } }, () => [
            h(JGrid, { cols: 12, gap: 'item' }, () => [
              h(JCol, { sm: 4 }, () =>
                h(JCard, { size: 'sm' }, () =>
                  h(JStack, { gap: 'inline' }, () => [
                    h(JInline, { justify: 'between' }, () => [
                      h('span', { style: { fontSize: 'var(--j-text-xs)', color: 'var(--j-fg-muted)' } }, 'P99 Latency'),
                      h(JBadge, { size: 'sm', variant: 'soft', tone: 'success' }, () => 'Healthy'),
                    ]),
                    h('strong', { style: { fontSize: 'var(--j-text-xl)' } }, '11.4 ms'),
                  ]),
                ),
              ),
              h(JCol, { sm: 4 }, () =>
                h(JCard, { size: 'sm' }, () =>
                  h(JStack, { gap: 'inline' }, () => [
                    h(JInline, { justify: 'between' }, () => [
                      h('span', { style: { fontSize: 'var(--j-text-xs)', color: 'var(--j-fg-muted)' } }, 'Throughput'),
                      h(JBadge, { size: 'sm', variant: 'soft', tone: 'info' }, () => '+18%'),
                    ]),
                    h('strong', { style: { fontSize: 'var(--j-text-xl)' } }, '48.2k/s'),
                  ]),
                ),
              ),
              h(JCol, { sm: 4 }, () =>
                h(JCard, { size: 'sm' }, () =>
                  h(JStack, { gap: 'inline' }, () => [
                    h(JInline, { justify: 'between' }, () => [
                      h('span', { style: { fontSize: 'var(--j-text-xs)', color: 'var(--j-fg-muted)' } }, 'On-call'),
                      h(JAvatar, { name: 'Platform Ops', size: 'xs', status: 'online' }),
                    ]),
                    h('strong', { style: { fontSize: 'var(--j-text-xl)' } }, '99.99%'),
                  ]),
                ),
              ),
            ]),

            h(JAlert, {
              tone: 'info',
              variant: 'soft',
              title: 'jenni-vue · Zero-<style> SFC wrappers',
              description: 'Thin Vue 3 reactivity over jenni-core @layer CSS + native <dialog> top-layer.',
            }),

            h(JProgress, { value: 78, max: 100, size: 'sm', label: 'Canary rollout progress' }),

            h(
              JTabs,
              {
                modelValue: activeTab.value,
                'onUpdate:modelValue': (v: string | number) => (activeTab.value = String(v)),
                size: 'sm',
              },
              () => [
                h(JTabList, { 'aria-label': 'Rollout tabs' }, () => [
                  h(JTab, { value: 'canary' }, () => 'Canary Rollout'),
                  h(JTab, { value: 'policy' }, () => 'Traffic Policy'),
                ]),
                h(JTabPanel, { value: 'canary' }, () =>
                  h(
                    JCard,
                    {
                      title: 'Deployment Rule',
                      description: 'Configure canary rollout and instant rollback.',
                    },
                    {
                      default: () =>
                        h(JStack, { gap: 'field' }, () => [
                          h(JGrid, { cols: 12, gap: 'item' }, () => [
                            h(JCol, { sm: 7 }, () =>
                              h(JField, null, () => [
                                h(JLabel, null, () => 'Service endpoint'),
                                h(JInput, {
                                  size: 'sm',
                                  modelValue: endpoint.value,
                                  'onUpdate:modelValue': (v: string | number | undefined) =>
                                    (endpoint.value = String(v ?? '')),
                                }),
                              ]),
                            ),
                            h(JCol, { sm: 5 }, () =>
                              h(JField, null, () => [
                                h(JLabel, null, () => 'Primary region'),
                                h(JSelect, {
                                  size: 'sm',
                                  options: REGIONS,
                                  modelValue: region.value,
                                  'onUpdate:modelValue': (v: string | number | undefined) =>
                                    (region.value = String(v ?? '')),
                                }),
                              ]),
                            ),
                          ]),
                          h(JInline, { gap: 'group' }, () => [
                            h(JSwitch, {
                              size: 'sm',
                              modelValue: autoPromote.value,
                              'onUpdate:modelValue': (v: boolean) => (autoPromote.value = v),
                              label: 'Auto canary promotion',
                            }),
                            h(JCheckbox, {
                              size: 'sm',
                              modelValue: auditLog.value,
                              'onUpdate:modelValue': (v: boolean) => (auditLog.value = v),
                              label: 'Immutable audit log',
                            }),
                          ]),
                        ]),
                      footer: () =>
                        h(JInline, { justify: 'between', style: { width: '100%' } }, () => [
                          h(
                            JButton,
                            {
                              size: 'sm',
                              variant: 'outline',
                              tone: 'neutral',
                              onClick: () => (dlgOpen.value = true),
                            },
                            () => 'Inspect Modal',
                          ),
                          h(JButton, { size: 'sm' }, () => 'Deploy release'),
                        ]),
                    },
                  ),
                ),
                h(JTabPanel, { value: 'policy' }, () =>
                  h(JCard, { size: 'sm', title: 'SLO Gate' }, () => 'Auto-rollback when P99 > 25 ms.'),
                ),
              ],
            ),

            h(
              JDialog,
              {
                open: dlgOpen.value,
                'onUpdate:open': (v: boolean) => (dlgOpen.value = v),
                title: 'Confirm Canary Promotion',
                description: 'Traffic will shift from 10% to 100% across 3 availability zones.',
              },
              {
                default: () => 'Zero z-index portals — rendered in browser native <dialog> top-layer.',
                footer: ({ close }: { close: () => void }) =>
                  h(JInline, { gap: 'related' }, () => [
                    h(JButton, { size: 'sm', variant: 'outline', tone: 'neutral', onClick: close }, () => 'Cancel'),
                    h(JButton, { size: 'sm', onClick: close }, () => 'Confirm'),
                  ]),
              },
            ),
          ]);
      },
    });

    activeApp = createApp(ParityApp);
    activeApp.mount(stage);
    await nextTick();
    return unmountActive;
  },

  mountRows(stage: HTMLElement, count: number) {
    unmountActive();
    stage.innerHTML = '';
    const step = ref(0);
    const indices = Array.from({ length: count }, (_, i) => i);

    const RowsApp = defineComponent({
      setup() {
        return () => {
          const s = step.value;
          return h(JList, { variant: 'divided' }, () =>
            indices.map((i) => {
              const active = (i + s) % 2 === 0;
              return h(
                JListItem,
                {
                  key: i,
                  title: `Service Node ${i}`,
                  description: `us-west-2 · gen-${s}`,
                },
                {
                  trailing: () => [
                    h(JBadge, { size: 'sm', tone: active ? 'success' : 'neutral' }, () => (active ? 'Live' : 'Idle')),
                    h(JSwitch, { size: 'sm', modelValue: active, 'aria-label': 'Active' }),
                    h(JButton, { size: 'sm', variant: 'outline', tone: 'neutral' }, () => 'Edit'),
                    h(JButton, { size: 'sm' }, () => 'Deploy'),
                  ],
                },
              );
            }),
          );
        };
      },
    });

    const app = createApp(RowsApp);
    app.mount(stage);
    activeApp = app;

    return {
      async updateState(next: number) {
        step.value = next;
        await nextTick();
      },
      async setTheme(dark: boolean, density = 'default') {
        applyTheme(dark, density);
        await nextTick();
      },
      unmount() {
        app.unmount();
        if (activeApp === app) activeApp = null;
        stage.innerHTML = '';
      },
    };
  },

  mountGrid(stage: HTMLElement, cards = 48) {
    unmountActive();
    stage.innerHTML = '';
    const indices = Array.from({ length: cards }, (_, i) => i);

    const GridApp = defineComponent({
      setup() {
        return () =>
          h(JGrid, { cols: 12, gap: 'item' }, () =>
            indices.map((i) =>
              h(JCol, { key: i, sm: 6, md: 4, lg: 3 }, () =>
                h(JCard, { size: 'sm' }, () =>
                  h(JInline, { justify: 'between' }, () => [
                    h(JBadge, { size: 'sm', variant: 'soft' }, () => `M-${i}`),
                    h('strong', `99.${i % 99}%`),
                  ]),
                ),
              ),
            ),
          );
      },
    });

    const app = createApp(GridApp);
    app.mount(stage);
    activeApp = app;

    return {
      unmount() {
        app.unmount();
        if (activeApp === app) activeApp = null;
        stage.innerHTML = '';
      },
    };
  },

  async cycleOverlay(stage: HTMLElement, iterations = 20) {
    unmountActive();
    stage.innerHTML = '';
    const open = ref(false);
    const tab = ref('a');

    const OverlayApp = defineComponent({
      setup() {
        return () =>
          h('div', [
            h(JTabs, { modelValue: tab.value, 'onUpdate:modelValue': (v: string | number) => (tab.value = String(v)) }, () => [
              h(JTabList, { 'aria-label': 'Bench tabs' }, () => [
                h(JTab, { value: 'a' }, () => 'Alpha'),
                h(JTab, { value: 'b' }, () => 'Beta'),
              ]),
              h(JTabPanel, { value: 'a' }, () => 'Panel A'),
              h(JTabPanel, { value: 'b' }, () => 'Panel B'),
            ]),
            h(
              JDialog,
              {
                open: open.value,
                'onUpdate:open': (v: boolean) => (open.value = v),
                title: 'Bench Dialog',
              },
              () => 'Dialog payload',
            ),
          ]);
      },
    });

    const app = createApp(OverlayApp);
    app.mount(stage);
    await nextTick();

    for (let i = 0; i < iterations; i++) {
      open.value = true;
      tab.value = i % 2 === 0 ? 'b' : 'a';
      await nextTick();
      void stage.offsetHeight;
      open.value = false;
      await nextTick();
      void stage.offsetHeight;
    }

    app.unmount();
    stage.innerHTML = '';
  },
};
