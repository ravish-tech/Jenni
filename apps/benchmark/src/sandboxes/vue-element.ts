import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import {
  ElAlert,
  ElAvatar,
  ElButton,
  ElCard,
  ElCheckbox,
  ElCol,
  ElDialog,
  ElInput,
  ElOption,
  ElProgress,
  ElRow,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
  ElTag,
} from 'element-plus';

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', !!dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.body.style.background = dark ? '#141414' : '#ffffff';
  document.body.style.color = dark ? '#e5eaf3' : '#303133';
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

  setTheme(dark: boolean) {
    applyTheme(dark);
  },

  async mountParity(stage: HTMLElement, opts?: { dark?: boolean }) {
    unmountActive();
    stage.innerHTML = '';
    if (opts?.dark != null) applyTheme(opts.dark);

    const endpoint = ref('api.acme.dev/v2');
    const region = ref('us-west');
    const autoPromote = ref(true);
    const auditLog = ref(true);
    const activeTab = ref('canary');
    const dlgOpen = ref(false);

    const ParityApp = defineComponent({
      setup() {
        return () =>
          h('div', { style: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'system-ui, sans-serif' } }, [
            h(ElRow, { gutter: 10 }, () => [
              h(ElCol, { xs: 24, sm: 8 }, () =>
                h(ElCard, { shadow: 'never', bodyStyle: { padding: '12px' } }, () => [
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
                    h('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'P99 Latency'),
                    h(ElTag, { type: 'success', size: 'small' }, () => 'Healthy'),
                  ]),
                  h('strong', { style: { fontSize: '18px' } }, '11.4 ms'),
                ]),
              ),
              h(ElCol, { xs: 24, sm: 8 }, () =>
                h(ElCard, { shadow: 'never', bodyStyle: { padding: '12px' } }, () => [
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
                    h('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'Throughput'),
                    h(ElTag, { type: 'primary', size: 'small' }, () => '+18%'),
                  ]),
                  h('strong', { style: { fontSize: '18px' } }, '48.2k/s'),
                ]),
              ),
              h(ElCol, { xs: 24, sm: 8 }, () =>
                h(ElCard, { shadow: 'never', bodyStyle: { padding: '12px' } }, () => [
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
                    h('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'On-call'),
                    h(ElAvatar, { size: 22 }, () => 'JO'),
                  ]),
                  h('strong', { style: { fontSize: '18px' } }, '99.99%'),
                ]),
              ),
            ]),

            h(ElAlert, {
              type: 'info',
              closable: false,
              showIcon: true,
              title: 'Element Plus BEM + CSS Vars Stack',
              description: 'BEM theme-chalk stylesheet + Floating UI / Popper overlays + Vue 3 SFC suite.',
            }),

            h(ElProgress, { percentage: 78, showText: false, strokeWidth: 6 }),

            h(ElTabs, { modelValue: activeTab.value, 'onUpdate:modelValue': (v: string | number) => (activeTab.value = String(v)) }, () => [
              h(ElTabPane, { label: 'Canary Rollout', name: 'canary' }, () =>
                h(
                  ElCard,
                  { shadow: 'never' },
                  {
                    header: () =>
                      h('div', [
                        h('strong', { style: { fontSize: '14px' } }, 'Deployment Rule'),
                        h('div', { style: { fontSize: '12px', opacity: 0.65 } }, 'Configure canary rollout and instant rollback.'),
                      ]),
                    default: () =>
                      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
                        h(ElRow, { gutter: 12 }, () => [
                          h(ElCol, { xs: 24, sm: 14 }, () => [
                            h('div', { style: { fontSize: '12px', marginBottom: '4px' } }, 'Service endpoint'),
                            h(ElInput, {
                              size: 'small',
                              modelValue: endpoint.value,
                              'onUpdate:modelValue': (v: string) => (endpoint.value = v),
                            }),
                          ]),
                          h(ElCol, { xs: 24, sm: 10 }, () => [
                            h('div', { style: { fontSize: '12px', marginBottom: '4px' } }, 'Primary region'),
                            h(
                              ElSelect,
                              {
                                size: 'small',
                                modelValue: region.value,
                                'onUpdate:modelValue': (v: string) => (region.value = v),
                              },
                              () => REGIONS.map((r) => h(ElOption, { key: r.value, label: r.label, value: r.value })),
                            ),
                          ]),
                        ]),
                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' } }, [
                          h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } }, [
                            h(ElSwitch, {
                              size: 'small',
                              modelValue: autoPromote.value,
                              'onUpdate:modelValue': (v: string | number | boolean) => (autoPromote.value = !!v),
                            }),
                            'Auto canary promotion',
                          ]),
                          h(ElCheckbox, {
                            size: 'small',
                            modelValue: auditLog.value,
                            'onUpdate:modelValue': (v: unknown) => (auditLog.value = !!v),
                            label: 'Immutable audit log',
                          }),
                        ]),
                        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--el-border-color-lighter)' } }, [
                          h(ElButton, { size: 'small', onClick: () => (dlgOpen.value = true) }, () => 'Inspect Modal'),
                          h(ElButton, { size: 'small', type: 'primary' }, () => 'Deploy release'),
                        ]),
                      ]),
                  },
                ),
              ),
              h(ElTabPane, { label: 'Traffic Policy', name: 'policy' }, () =>
                h(ElCard, { shadow: 'never' }, () => 'Auto-rollback when P99 > 25 ms.'),
              ),
            ]),

            h(
              ElDialog,
              {
                modelValue: dlgOpen.value,
                'onUpdate:modelValue': (v: boolean) => (dlgOpen.value = v),
                title: 'Confirm Canary Promotion',
                width: '380px',
              },
              {
                default: () => 'Traffic will shift from 10% to 100% across 3 availability zones.',
                footer: () =>
                  h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, [
                    h(ElButton, { size: 'small', onClick: () => (dlgOpen.value = false) }, () => 'Cancel'),
                    h(ElButton, { size: 'small', type: 'primary', onClick: () => (dlgOpen.value = false) }, () => 'Confirm'),
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
          return h(
            'div',
            { style: { fontFamily: 'system-ui, sans-serif' } },
            indices.map((i) => {
              const active = (i + s) % 2 === 0;
              return h(
                'div',
                {
                  key: i,
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--el-border-color-lighter, #ebeef5)',
                  },
                },
                [
                  h('div', { style: { flex: 1, minWidth: 0 } }, [
                    h('div', { style: { fontSize: '13px', fontWeight: 500 } }, `Service Node ${i}`),
                    h('div', { style: { fontSize: '11px', opacity: 0.65 } }, `us-west-2 · gen-${s}`),
                  ]),
                  h(ElTag, { size: 'small', type: active ? 'success' : 'info' }, () => (active ? 'Live' : 'Idle')),
                  h(ElSwitch, { size: 'small', modelValue: active, 'aria-label': 'Active' }),
                  h(ElButton, { size: 'small' }, () => 'Edit'),
                  h(ElButton, { size: 'small', type: 'primary' }, () => 'Deploy'),
                ],
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
      async setTheme(dark: boolean) {
        applyTheme(dark);
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
          h(ElRow, { gutter: 10 }, () =>
            indices.map((i) =>
              h(ElCol, { key: i, xs: 24, sm: 12, md: 8, lg: 6, style: { marginBottom: '8px' } }, () =>
                h(ElCard, { shadow: 'never', bodyStyle: { padding: '10px', display: 'flex', justifyContent: 'space-between' } }, () => [
                  h(ElTag, { size: 'small', type: 'info' }, () => `M-${i}`),
                  h('strong', `99.${i % 99}%`),
                ]),
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
            h(ElTabs, { modelValue: tab.value, 'onUpdate:modelValue': (v: string | number) => (tab.value = String(v)) }, () => [
              h(ElTabPane, { label: 'Alpha', name: 'a' }, () => 'Panel A'),
              h(ElTabPane, { label: 'Beta', name: 'b' }, () => 'Panel B'),
            ]),
            h(
              ElDialog,
              {
                modelValue: open.value,
                'onUpdate:modelValue': (v: boolean) => (open.value = v),
                title: 'Bench Dialog',
                appendToBody: false,
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
