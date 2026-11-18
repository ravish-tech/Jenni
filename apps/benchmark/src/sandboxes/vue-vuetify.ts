import 'vuetify/styles';
import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import { createVuetify } from 'vuetify';
import {
  VAlert,
  VApp,
  VAvatar,
  VBtn,
  VCard,
  VCardActions,
  VCardSubtitle,
  VCardText,
  VCardTitle,
  VCheckbox,
  VChip,
  VCol,
  VDialog,
  VProgressLinear,
  VRow,
  VSelect,
  VSwitch,
  VTab,
  VTabs,
  VTextField,
} from 'vuetify/components';

const REGIONS = [
  { title: 'US West (Oregon)', value: 'us-west' },
  { title: 'EU Central (Frankfurt)', value: 'eu-central' },
  { title: 'AP Northeast (Tokyo)', value: 'ap-northeast' },
];

let activeApp: App | null = null;
let activeThemeSetter: ((dark: boolean) => void) | null = null;

function unmountActive() {
  if (activeApp) {
    activeApp.unmount();
    activeApp = null;
    activeThemeSetter = null;
  }
}

function makeVuetify(initialDark = false) {
  const vuetify = createVuetify({
    theme: { defaultTheme: initialDark ? 'dark' : 'light' },
  });
  const setDark = (dark: boolean) => {
    const next = dark ? 'dark' : 'light';
    if (typeof (vuetify.theme as any).change === 'function') {
      (vuetify.theme as any).change(next);
    } else {
      vuetify.theme.global.name.value = next;
    }
  };
  return { vuetify, setDark };
}

(window as any).__benchAdapter = {
  mode: 'component',

  setTheme(dark: boolean) {
    activeThemeSetter?.(dark);
  },

  async mountParity(stage: HTMLElement, opts?: { dark?: boolean }) {
    unmountActive();
    stage.innerHTML = '';
    const { vuetify, setDark } = makeVuetify(!!opts?.dark);
    activeThemeSetter = setDark;

    const endpoint = ref('api.acme.dev/v2');
    const region = ref('us-west');
    const autoPromote = ref(true);
    const auditLog = ref(true);
    const activeTab = ref('canary');
    const dlgOpen = ref(false);

    const ParityApp = defineComponent({
      setup() {
        return () =>
          h(VApp, { style: { minHeight: 'auto' } }, () =>
            h('div', { style: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' } }, [
              h(VRow, { dense: true }, () => [
                h(VCol, { cols: 12, sm: 4 }, () =>
                  h(VCard, { variant: 'outlined' }, () =>
                    h(VCardText, { style: { padding: '12px' } }, () => [
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                        h('span', { style: { fontSize: '12px', opacity: 0.75 } }, 'P99 Latency'),
                        h(VChip, { size: 'x-small', color: 'success', variant: 'tonal' }, () => 'Healthy'),
                      ]),
                      h('strong', { style: { fontSize: '18px' } }, '11.4 ms'),
                    ]),
                  ),
                ),
                h(VCol, { cols: 12, sm: 4 }, () =>
                  h(VCard, { variant: 'outlined' }, () =>
                    h(VCardText, { style: { padding: '12px' } }, () => [
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                        h('span', { style: { fontSize: '12px', opacity: 0.75 } }, 'Throughput'),
                        h(VChip, { size: 'x-small', color: 'info', variant: 'tonal' }, () => '+18%'),
                      ]),
                      h('strong', { style: { fontSize: '18px' } }, '48.2k/s'),
                    ]),
                  ),
                ),
                h(VCol, { cols: 12, sm: 4 }, () =>
                  h(VCard, { variant: 'outlined' }, () =>
                    h(VCardText, { style: { padding: '12px' } }, () => [
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                        h('span', { style: { fontSize: '12px', opacity: 0.75 } }, 'On-call'),
                        h(VAvatar, { size: 22, color: 'primary' }, () => h('span', { style: { fontSize: '10px' } }, 'JO')),
                      ]),
                      h('strong', { style: { fontSize: '18px' } }, '99.99%'),
                    ]),
                  ),
                ),
              ]),

              h(VAlert, {
                type: 'info',
                variant: 'tonal',
                density: 'compact',
                title: 'Vuetify 3 Material Design Stack',
                text: 'Global theme provider + Sass/CSS layers + VApp overlay & ripple wrappers.',
              }),

              h(VProgressLinear, { modelValue: 78, color: 'primary', height: 6, rounded: true }),

              h(VTabs, {
                modelValue: activeTab.value,
                'onUpdate:modelValue': (v: unknown) => (activeTab.value = String(v)),
                density: 'compact',
                color: 'primary',
              }, () => [
                h(VTab, { value: 'canary' }, () => 'Canary Rollout'),
                h(VTab, { value: 'policy' }, () => 'Traffic Policy'),
              ]),

              activeTab.value === 'canary'
                ? h(VCard, { variant: 'outlined' }, () => [
                    h(VCardTitle, { style: { fontSize: '15px', paddingBottom: '2px' } }, () => 'Deployment Rule'),
                    h(VCardSubtitle, null, () => 'Configure canary rollout and instant rollback.'),
                    h(VCardText, null, () => [
                      h(VRow, { dense: true }, () => [
                        h(VCol, { cols: 12, sm: 7 }, () =>
                          h(VTextField, {
                            label: 'Service endpoint',
                            density: 'compact',
                            variant: 'outlined',
                            hideDetails: true,
                            modelValue: endpoint.value,
                            'onUpdate:modelValue': (v: string) => (endpoint.value = v),
                          }),
                        ),
                        h(VCol, { cols: 12, sm: 5 }, () =>
                          h(VSelect, {
                            label: 'Primary region',
                            density: 'compact',
                            variant: 'outlined',
                            hideDetails: true,
                            items: REGIONS,
                            modelValue: region.value,
                            'onUpdate:modelValue': (v: string) => (region.value = v),
                          }),
                        ),
                      ]),
                      h('div', { style: { display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' } }, [
                        h(VSwitch, {
                          density: 'compact',
                          color: 'primary',
                          hideDetails: true,
                          modelValue: autoPromote.value,
                          'onUpdate:modelValue': (v: unknown) => (autoPromote.value = !!v),
                          label: 'Auto canary promotion',
                        }),
                        h(VCheckbox, {
                          density: 'compact',
                          color: 'primary',
                          hideDetails: true,
                          modelValue: auditLog.value,
                          'onUpdate:modelValue': (v: unknown) => (auditLog.value = !!v),
                          label: 'Immutable audit log',
                        }),
                      ]),
                    ]),
                    h(VCardActions, { style: { justifyContent: 'space-between', padding: '8px 16px 12px' } }, () => [
                      h(VBtn, { size: 'small', variant: 'outlined', onClick: () => (dlgOpen.value = true) }, () => 'Inspect Modal'),
                      h(VBtn, { size: 'small', variant: 'flat', color: 'primary' }, () => 'Deploy release'),
                    ]),
                  ])
                : h(VCard, { variant: 'outlined' }, () =>
                    h(VCardText, null, () => 'Auto-rollback when P99 > 25 ms.'),
                  ),

              h(
                VDialog,
                {
                  modelValue: dlgOpen.value,
                  'onUpdate:modelValue': (v: boolean) => (dlgOpen.value = v),
                  maxWidth: 420,
                },
                () =>
                  h(VCard, null, () => [
                    h(VCardTitle, null, () => 'Confirm Canary Promotion'),
                    h(VCardText, null, () => 'Traffic will shift from 10% to 100% across 3 availability zones.'),
                    h(VCardActions, { style: { justifyContent: 'flex-end' } }, () => [
                      h(VBtn, { size: 'small', variant: 'text', onClick: () => (dlgOpen.value = false) }, () => 'Cancel'),
                      h(VBtn, { size: 'small', color: 'primary', variant: 'flat', onClick: () => (dlgOpen.value = false) }, () => 'Confirm'),
                    ]),
                  ]),
              ),
            ]),
          );
      },
    });

    activeApp = createApp(ParityApp);
    activeApp.use(vuetify);
    activeApp.mount(stage);
    await nextTick();
    return unmountActive;
  },

  mountRows(stage: HTMLElement, count: number) {
    unmountActive();
    stage.innerHTML = '';
    const { vuetify, setDark } = makeVuetify(false);
    activeThemeSetter = setDark;
    const step = ref(0);
    const indices = Array.from({ length: count }, (_, i) => i);

    const RowsApp = defineComponent({
      setup() {
        return () => {
          const s = step.value;
          return h(VApp, { style: { minHeight: 'auto' } }, () =>
            h(
              'div',
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
                      borderBottom: '1px solid rgba(128,128,128,0.2)',
                    },
                  },
                  [
                    h('div', { style: { flex: 1, minWidth: 0 } }, [
                      h('div', { style: { fontSize: '13px', fontWeight: 500 } }, `Service Node ${i}`),
                      h('div', { style: { fontSize: '11px', opacity: 0.65 } }, `us-west-2 · gen-${s}`),
                    ]),
                    h(VChip, { size: 'x-small', color: active ? 'success' : 'default', variant: 'tonal' }, () =>
                      active ? 'Live' : 'Idle',
                    ),
                    h(VSwitch, { modelValue: active, density: 'compact', hideDetails: true, color: 'primary' }),
                    h(VBtn, { size: 'small', variant: 'outlined' }, () => 'Edit'),
                    h(VBtn, { size: 'small', variant: 'flat', color: 'primary' }, () => 'Deploy'),
                  ],
                );
              }),
            ),
          );
        };
      },
    });

    const app = createApp(RowsApp);
    app.use(vuetify);
    app.mount(stage);
    activeApp = app;

    return {
      async updateState(next: number) {
        step.value = next;
        await nextTick();
      },
      async setTheme(dark: boolean) {
        setDark(dark);
        await nextTick();
      },
      unmount() {
        app.unmount();
        if (activeApp === app) {
          activeApp = null;
          activeThemeSetter = null;
        }
        stage.innerHTML = '';
      },
    };
  },

  mountGrid(stage: HTMLElement, cards = 48) {
    unmountActive();
    stage.innerHTML = '';
    const { vuetify } = makeVuetify(false);
    const indices = Array.from({ length: cards }, (_, i) => i);

    const GridApp = defineComponent({
      setup() {
        return () =>
          h(VApp, { style: { minHeight: 'auto' } }, () =>
            h(VRow, { dense: true }, () =>
              indices.map((i) =>
                h(VCol, { key: i, cols: 12, sm: 6, md: 4, lg: 3 }, () =>
                  h(VCard, { variant: 'outlined' }, () =>
                    h(VCardText, { style: { padding: '10px', display: 'flex', justifyContent: 'space-between' } }, () => [
                      h(VChip, { size: 'x-small' }, () => `M-${i}`),
                      h('strong', `99.${i % 99}%`),
                    ]),
                  ),
                ),
              ),
            ),
          );
      },
    });

    const app = createApp(GridApp);
    app.use(vuetify);
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
    const { vuetify } = makeVuetify(false);
    const open = ref(false);
    const tab = ref('a');

    const OverlayApp = defineComponent({
      setup() {
        return () =>
          h(VApp, { style: { minHeight: 'auto' } }, () => [
            h(VTabs, { modelValue: tab.value, 'onUpdate:modelValue': (v: unknown) => (tab.value = String(v)) }, () => [
              h(VTab, { value: 'a' }, () => 'Alpha'),
              h(VTab, { value: 'b' }, () => 'Beta'),
            ]),
            h(
              VDialog,
              {
                modelValue: open.value,
                'onUpdate:modelValue': (v: boolean) => (open.value = v),
                transition: false,
                attach: true,
              },
              () => h(VCard, null, () => h(VCardText, null, () => 'Dialog payload')),
            ),
          ]);
      },
    });

    const app = createApp(OverlayApp);
    app.use(vuetify);
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
