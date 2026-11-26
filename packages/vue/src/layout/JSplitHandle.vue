<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  createSplitHandle,
  type SplitHandleController,
  type SplitHandleDragPayload,
  type SplitHandleOrientation,
  type SplitHandleSource,
} from 'jenni-core/behaviors/split-handle.js';
import { attr } from './types';

export type { SplitHandleDragPayload, SplitHandleOrientation, SplitHandleSource };

export interface JSplitHandleProps {
  /** Split direction: `'horizontal'` (vertical 1px bar between left/right panes) or `'vertical'` (horizontal 1px bar between top/bottom panes). */
  orientation?: SplitHandleOrientation;
  /** Render a centered 9px grip pill on the 1px hairline. */
  withGrip?: boolean;
  /** Disable pointer and keyboard resizing. */
  disabled?: boolean;
  /** Keyboard arrow step in pixels (default 16). */
  step?: number;
  /** Keyboard Shift+Arrow step in pixels (default 64). */
  largeStep?: number;
  /** Accessible label for the WAI-ARIA separator. */
  ariaLabel?: string;
  /** Current separator position (`aria-valuenow`). */
  valueNow?: number;
  /** Minimum separator position (`aria-valuemin`). */
  valueMin?: number;
  /** Maximum separator position (`aria-valuemax`). */
  valueMax?: number;
}

const props = withDefaults(defineProps<JSplitHandleProps>(), {
  orientation: 'horizontal',
  withGrip: false,
  disabled: false,
  step: 16,
  largeStep: 64,
});

const emit = defineEmits<{
  dragStart: [event: PointerEvent];
  drag: [payload: SplitHandleDragPayload];
  dragEnd: [event: PointerEvent];
}>();

const rootEl = ref<HTMLElement | null>(null);
let ctrl: SplitHandleController | null = null;

function syncController() {
  if (!rootEl.value) return;
  const opts = {
    orientation: props.orientation,
    disabled: props.disabled,
    step: props.step,
    largeStep: props.largeStep,
    onDragStart: (e: PointerEvent) => emit('dragStart', e),
    onDrag: (payload: SplitHandleDragPayload) => emit('drag', payload),
    onDragEnd: (e: PointerEvent) => emit('dragEnd', e),
  };
  if (ctrl) {
    ctrl.update(opts);
  } else {
    ctrl = createSplitHandle(rootEl.value, opts);
  }
}

onMounted(syncController);

watch(
  () => [props.orientation, props.disabled, props.step, props.largeStep],
  () => syncController(),
);

onBeforeUnmount(() => {
  ctrl?.destroy();
  ctrl = null;
});

defineExpose({
  isDragging: () => ctrl?.isDragging() ?? false,
  getElement: () => rootEl.value,
});
</script>

<template>
  <div
    ref="rootEl"
    class="j-resize-handle"
    role="separator"
    :tabindex="disabled ? -1 : 0"
    :aria-orientation="orientation === 'horizontal' ? 'vertical' : 'horizontal'"
    :aria-label="ariaLabel || undefined"
    :aria-disabled="disabled ? 'true' : undefined"
    :aria-valuenow="valueNow != null ? valueNow : undefined"
    :aria-valuemin="valueMin != null ? valueMin : undefined"
    :aria-valuemax="valueMax != null ? valueMax : undefined"
    :data-orientation="attr(orientation, 'horizontal')"
    :data-with-grip="withGrip ? '' : undefined"
    :data-disabled="disabled ? '' : undefined"
  />
</template>
