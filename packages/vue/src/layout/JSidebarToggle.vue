<script setup lang="ts">
import { computed, inject } from 'vue';
import JIcon from '../display/JIcon.vue';
import JTooltip from '../overlay/JTooltip.vue';
import { JSidebarLayoutKey, type JSidebarToggleProps } from './sidebar-layout-context';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<JSidebarToggleProps>(), {
  tooltipSide: 'bottom',
  disabled: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const ctx = inject(JSidebarLayoutKey, null);

const resolvedNoun = computed(() => {
  const raw = props.label ?? ctx?.toggleLabel.value ?? 'sidebar';
  return raw.trim() || 'sidebar';
});

const tooltipText = computed(() =>
  ctx?.state.value === 'open' ? `Hide ${resolvedNoun.value}` : `Show ${resolvedNoun.value}`,
);

function handleClick(e: MouseEvent) {
  emit('click', e);
  if (e.defaultPrevented || props.disabled) return;
  ctx?.toggle();
}
</script>

<template>
  <JTooltip
    v-if="ctx"
    :content="tooltipText"
    :side="tooltipSide"
    :kbd="kbd"
    :disabled="disabled"
  >
    <button
      type="button"
      class="j-button j-sidebar-toggle"
      data-variant="ghost"
      data-size="sm"
      data-icon-only=""
      :disabled="disabled ? true : undefined"
      :aria-label="tooltipText"
      :aria-expanded="ctx.state.value === 'open' ? 'true' : 'false'"
      v-bind="$attrs"
      @click="handleClick"
    >
      <JIcon name="dock-left" />
    </button>
  </JTooltip>
</template>
