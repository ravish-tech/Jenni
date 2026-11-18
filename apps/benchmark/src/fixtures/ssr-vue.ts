import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { JBadge, JButton, JCard, JCol, JGrid, JList, JListItem, JSwitch } from 'jenni-vue';
import { createVuetify } from 'vuetify';
import { VBtn, VCard, VCardText, VChip, VCol, VRow, VSwitch as VtSwitch } from 'vuetify/components';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import PvButton from 'primevue/button';
import PvCard from 'primevue/card';
import PvTag from 'primevue/tag';
import PvSwitch from 'primevue/toggleswitch';
import { ElButton, ElCard, ElCol, ElRow, ElSwitch, ElTag } from 'element-plus';

export async function renderVuePayloads(rows = 200, cards = 24): Promise<Record<string, string>> {
  const rowIdx = Array.from({ length: rows }, (_, i) => i);
  const cardIdx = Array.from({ length: cards }, (_, i) => i);

  // 1. jenni-vue
  const jenniApp = createSSRApp({
    render: () =>
      h('div', [
        h(JList, { variant: 'divided' }, () =>
          rowIdx.map((i) =>
            h(
              JListItem,
              { key: i, title: `Service Node ${i}`, description: 'us-west-2 · replica-set' },
              {
                trailing: () => [
                  h(JBadge, { size: 'sm', tone: 'success' }, () => 'Live'),
                  h(JSwitch, { size: 'sm', modelValue: i % 2 === 0, 'aria-label': 'Active' }),
                  h(JButton, { size: 'sm', variant: 'outline' }, () => 'Edit'),
                  h(JButton, { size: 'sm' }, () => 'Deploy'),
                ],
              },
            ),
          ),
        ),
        h(JGrid, { cols: 12, gap: 'item' }, () =>
          cardIdx.map((i) =>
            h(JCol, { key: i, sm: 6, md: 4, lg: 3 }, () =>
              h(JCard, { size: 'sm' }, () => [h(JBadge, { size: 'sm', variant: 'soft' }, () => `M-${i}`), h('strong', `99.${i % 99}%`)]),
            ),
          ),
        ),
      ]),
  });

  // 2. Vuetify 3
  const vuetify = createVuetify({ ssr: true });
  const vuetifyApp = createSSRApp({
    render: () =>
      h('div', [
        h(
          'div',
          rowIdx.map((i) =>
            h('div', { key: i, class: 'd-flex align-center ga-2 py-2 px-3' }, [
              h('div', [h('div', `Service Node ${i}`), h('div', 'us-west-2 · replica-set')]),
              h(VChip, { size: 'x-small', color: 'success' }, () => 'Live'),
              h(VtSwitch, { modelValue: i % 2 === 0, density: 'compact', hideDetails: true }),
              h(VBtn, { size: 'small', variant: 'outlined' }, () => 'Edit'),
              h(VBtn, { size: 'small', color: 'primary' }, () => 'Deploy'),
            ]),
          ),
        ),
        h(VRow, { dense: true }, () =>
          cardIdx.map((i) =>
            h(VCol, { key: i, cols: 12, sm: 6, md: 4, lg: 3 }, () =>
              h(VCard, { variant: 'outlined' }, () =>
                h(VCardText, null, () => [h(VChip, { size: 'x-small' }, () => `M-${i}`), h('strong', `99.${i % 99}%`)]),
              ),
            ),
          ),
        ),
      ]),
  });
  vuetifyApp.use(vuetify);

  // 3. PrimeVue 4
  const primeApp = createSSRApp({
    render: () =>
      h('div', [
        h(
          'div',
          rowIdx.map((i) =>
            h('div', { key: i }, [
              h('div', [h('div', `Service Node ${i}`), h('div', 'us-west-2 · replica-set')]),
              h(PvTag, { severity: 'success', value: 'Live' }),
              h(PvSwitch, { modelValue: i % 2 === 0 }),
              h(PvButton, { label: 'Edit', size: 'small', severity: 'secondary', outlined: true }),
              h(PvButton, { label: 'Deploy', size: 'small' }),
            ]),
          ),
        ),
        h(
          'div',
          cardIdx.map((i) =>
            h(PvCard, { key: i }, {
              content: () => [h(PvTag, { value: `M-${i}` }), h('strong', `99.${i % 99}%`)],
            }),
          ),
        ),
      ]),
  });
  primeApp.use(PrimeVue, { theme: { preset: Aura } });

  // 4. Element Plus
  const elementApp = createSSRApp({
    render: () =>
      h('div', [
        h(
          'div',
          rowIdx.map((i) =>
            h('div', { key: i }, [
              h('div', [h('div', `Service Node ${i}`), h('div', 'us-west-2 · replica-set')]),
              h(ElTag, { size: 'small', type: 'success' }, () => 'Live'),
              h(ElSwitch, { size: 'small', modelValue: i % 2 === 0 }),
              h(ElButton, { size: 'small' }, () => 'Edit'),
              h(ElButton, { size: 'small', type: 'primary' }, () => 'Deploy'),
            ]),
          ),
        ),
        h(ElRow, { gutter: 10 }, () =>
          cardIdx.map((i) =>
            h(ElCol, { key: i, xs: 24, sm: 12, md: 8, lg: 6 }, () =>
              h(ElCard, { shadow: 'never' }, () => [h(ElTag, { size: 'small' }, () => `M-${i}`), h('strong', `99.${i % 99}%`)]),
            ),
          ),
        ),
      ]),
  });

  return {
    jenni: await renderToString(jenniApp),
    vuetify: await renderToString(vuetifyApp),
    primevue: await renderToString(primeApp),
    element: await renderToString(elementApp),
  };
}
