import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import Tag from 'primevue/tag';
import ToggleSwitch from 'primevue/toggleswitch';

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('pv-dark', !!dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.body.style.background = dark ? '#09090b' : '#ffffff';
  document.body.style.color = dark ? '#fafafa' : '#18181b';
}

const REGIONS = [
  { label: 'US West (Oregon)', value: 'us-west' },
  { label: 'EU Central (Frankfurt)', value: 'eu-central' },
  { label: 'AP Northeast (Tokyo)', value: 'ap-northeast' },
];

function installPrime(app: App) {
  app.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: { darkModeSelector: '.pv-dark' },
    },
  });
}

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
            h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' } }, [
              h(Card, null, {
                content: () =>
                  h('div', [
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
                      h('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'P99 Latency'),
                      h(Tag, { severity: 'success', value: 'Healthy' }),
                    ]),
                    h('strong', { style: { fontSize: '18px' } }, '11.4 ms'),
                  ]),
              }),
              h(Card, null, {
                content: () =>
                  h('div', [
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
                      h('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'Throughput'),
                      h(Tag, { severity: 'info', value: '+18%' }),
                    ]),
                    h('strong', { style: { fontSize: '18px' } }, '48.2k/s'),
                  ]),
              }),
              h(Card, null, {
                content: () =>
                  h('div', [
                    h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' } }, [
                      h('span', { style: { fontSize: '12px', opacity: 0.7 } }, 'On-call'),
                      h(Avatar, { label: 'JO', shape: 'circle', size: 'normal' }),
                    ]),
                    h('strong', { style: { fontSize: '18px' } }, '99.99%'),
                  ]),
              }),
            ]),

            h(Message, { severity: 'info' }, () => 'PrimeVue 4 + @primeuix/themes Aura (runtime JS token-to-<style> injection).'),

            h(ProgressBar, { value: 78, showValue: false, style: { height: '8px' } }),

            h(Tabs, { value: activeTab.value, 'onUpdate:value': (v: string | number) => (activeTab.value = String(v)) }, () => [
              h(TabList, null, () => [
                h(Tab, { value: 'canary' }, () => 'Canary Rollout'),
                h(Tab, { value: 'policy' }, () => 'Traffic Policy'),
              ]),
              h(TabPanels, null, () => [
                h(TabPanel, { value: 'canary' }, () =>
                  h(Card, null, {
                    title: () => h('span', { style: { fontSize: '15px' } }, 'Deployment Rule'),
                    subtitle: () => h('span', { style: { fontSize: '12px' } }, 'Configure canary rollout and instant rollback.'),
                    content: () =>
                      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
                        h('div', { style: { display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '12px' } }, [
                          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
                            h('label', { style: { fontSize: '12px', fontWeight: 500 } }, 'Service endpoint'),
                            h(InputText, {
                              size: 'small',
                              modelValue: endpoint.value,
                              'onUpdate:modelValue': (v: string | undefined) => (endpoint.value = v ?? ''),
                            }),
                          ]),
                          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } }, [
                            h('label', { style: { fontSize: '12px', fontWeight: 500 } }, 'Primary region'),
                            h(Select, {
                              size: 'small',
                              options: REGIONS,
                              optionLabel: 'label',
                              optionValue: 'value',
                              modelValue: region.value,
                              'onUpdate:modelValue': (v: string) => (region.value = v),
                            }),
                          ]),
                        ]),
                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' } }, [
                          h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } }, [
                            h(ToggleSwitch, {
                              modelValue: autoPromote.value,
                              'onUpdate:modelValue': (v: boolean) => (autoPromote.value = v),
                            }),
                            'Auto canary promotion',
                          ]),
                          h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' } }, [
                            h(Checkbox, {
                              binary: true,
                              modelValue: auditLog.value,
                              'onUpdate:modelValue': (v: boolean) => (auditLog.value = v),
                            }),
                            'Immutable audit log',
                          ]),
                        ]),
                      ]),
                    footer: () =>
                      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                        h(Button, {
                          label: 'Inspect Modal',
                          size: 'small',
                          severity: 'secondary',
                          outlined: true,
                          onClick: () => (dlgOpen.value = true),
                        }),
                        h(Button, { label: 'Deploy release', size: 'small' }),
                      ]),
                  }),
                ),
                h(TabPanel, { value: 'policy' }, () => h('div', 'Auto-rollback when P99 > 25 ms.')),
              ]),
            ]),

            h(
              Dialog,
              {
                visible: dlgOpen.value,
                'onUpdate:visible': (v: boolean) => (dlgOpen.value = v),
                modal: true,
                header: 'Confirm Canary Promotion',
                style: { width: '24rem' },
              },
              {
                default: () => h('p', { style: { margin: 0, fontSize: '13px' } }, 'Traffic will shift from 10% to 100% across 3 availability zones.'),
                footer: () =>
                  h('div', { style: { display: 'flex', gap: '8px', justifyContent: 'flex-end' } }, [
                    h(Button, { label: 'Cancel', size: 'small', severity: 'secondary', text: true, onClick: () => (dlgOpen.value = false) }),
                    h(Button, { label: 'Confirm', size: 'small', onClick: () => (dlgOpen.value = false) }),
                  ]),
              },
            ),
          ]);
      },
    });

    activeApp = createApp(ParityApp);
    installPrime(activeApp);
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
                    borderBottom: '1px solid rgba(128,128,128,0.2)',
                  },
                },
                [
                  h('div', { style: { flex: 1, minWidth: 0 } }, [
                    h('div', { style: { fontSize: '13px', fontWeight: 500 } }, `Service Node ${i}`),
                    h('div', { style: { fontSize: '11px', opacity: 0.65 } }, `us-west-2 · gen-${s}`),
                  ]),
                  h(Tag, { severity: active ? 'success' : 'secondary', value: active ? 'Live' : 'Idle' }),
                  h(ToggleSwitch, { modelValue: active, 'aria-label': 'Active' }),
                  h(Button, { label: 'Edit', size: 'small', severity: 'secondary', outlined: true }),
                  h(Button, { label: 'Deploy', size: 'small' }),
                ],
              );
            }),
          );
        };
      },
    });

    const app = createApp(RowsApp);
    installPrime(app);
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
          h(
            'div',
            { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' } },
            indices.map((i) =>
              h(Card, { key: i }, {
                content: () =>
                  h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                    h(Tag, { severity: 'secondary', value: `M-${i}` }),
                    h('strong', `99.${i % 99}%`),
                  ]),
              }),
            ),
          );
      },
    });

    const app = createApp(GridApp);
    installPrime(app);
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
            h(Tabs, { value: tab.value, 'onUpdate:value': (v: string | number) => (tab.value = String(v)) }, () => [
              h(TabList, null, () => [
                h(Tab, { value: 'a' }, () => 'Alpha'),
                h(Tab, { value: 'b' }, () => 'Beta'),
              ]),
              h(TabPanels, null, () => [
                h(TabPanel, { value: 'a' }, () => 'Panel A'),
                h(TabPanel, { value: 'b' }, () => 'Panel B'),
              ]),
            ]),
            h(
              Dialog,
              {
                visible: open.value,
                'onUpdate:visible': (v: boolean) => (open.value = v),
                modal: true,
                header: 'Bench Dialog',
              },
              () => 'Dialog payload',
            ),
          ]);
      },
    });

    const app = createApp(OverlayApp);
    installPrime(app);
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
