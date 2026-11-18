<script setup lang="ts">
// JTabs — WAI-ARIA tabs container with underline or pill sliding indicator.
//   <JTabs v-model="tab" variant="underline">
//     <JTabList aria-label="Settings">
//       <JTab value="general">General</JTab>
//       <JTab value="billing">Billing</JTab>
//     </JTabList>
//     <JTabPanel value="general">…</JTabPanel>
//     <JTabPanel value="billing">…</JTabPanel>
//   </JTabs>
import { computed, provide, useId } from 'vue';
import {
  TabsKey,
  type OverlaySize,
  type TabsActivation,
  type TabsOrientation,
  type TabsVariant,
} from './types';

const model = defineModel<string | number>();

const props = withDefaults(
  defineProps<{
    defaultValue?: string | number;
    variant?: TabsVariant;
    size?: OverlaySize;
    orientation?: TabsOrientation;
    activation?: TabsActivation;
    full?: boolean;
  }>(),
  {
    variant: 'underline',
    size: 'md',
    orientation: 'horizontal',
    activation: 'automatic',
  },
);

const emit = defineEmits<{ change: [value: string | number] }>();

if (model.value === undefined && props.defaultValue !== undefined) {
  model.value = props.defaultValue;
}

const baseId = useId();
const tabEls = new WeakMap<HTMLElement, string | number>();

function slug(val: string | number) {
  return String(val).replace(/[^a-zA-Z0-9_-]/g, '-');
}

function select(val: string | number) {
  if (model.value === val) return;
  model.value = val;
  emit('change', val);
}

provide(TabsKey, {
  baseId,
  value: model,
  orientation: computed(() => props.orientation),
  activation: computed(() => props.activation),
  select,
  tabId: (val) => `${baseId}-tab-${slug(val)}`,
  panelId: (val) => `${baseId}-panel-${slug(val)}`,
  registerTab(el, val, disabled) {
    if (el) tabEls.set(el, val);
    if (model.value === undefined && !disabled) {
      model.value = val;
    }
  },
  getTabValue: (el) => tabEls.get(el),
});
</script>

<template>
  <div
    class="j-tabs"
    :data-variant="variant === 'pill' ? 'pill' : undefined"
    :data-size="size === 'md' ? undefined : size"
    :data-orientation="orientation === 'vertical' ? 'vertical' : undefined"
    :data-activation="activation === 'manual' ? 'manual' : undefined"
    :data-full="full ? '' : undefined"
  >
    <slot />
  </div>
</template>
