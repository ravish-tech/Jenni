<script setup lang="ts">
// JToaster — top-layer `popover="manual"` notification deck.
// Pair with `import { toast } from 'jenni-vue'` anywhere in your app.
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  bindToasterInteractions,
  dismissToast,
  promoteToaster,
  registerToastHost,
  subscribeToasts,
  syncToasterLayout,
  type ToastItem,
  type ToasterPosition,
} from 'jenni-core/behaviors/toast.js';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    position?: ToasterPosition;
    /** Maximum visible stacked cards (default 3). */
    max?: number;
    /** Keep the toast deck expanded continuously. */
    expanded?: boolean;
  }>(),
  { position: 'bottom-end', max: 3 },
);

const el = ref<HTMLElement | null>(null);
const list = ref<ToastItem[]>([]);
let prevTopId = '';
let stopHost: (() => void) | null = null;
let stopSub: (() => void) | null = null;
let stopInteract: (() => void) | null = null;

function refresh(repromote = false) {
  if (!el.value) return;
  promoteToaster(el.value, list.value.length > 0, repromote);
  requestAnimationFrame(() => {
    if (el.value) syncToasterLayout(el.value, props.max);
  });
}

function onAction(item: ToastItem) {
  item.action?.onClick?.();
  dismissToast(item.id);
}

onMounted(() => {
  stopHost = registerToastHost();
  if (el.value) stopInteract = bindToasterInteractions(el.value, { max: props.max });
  stopSub = subscribeToasts(async (next) => {
    const topId = next[0]?.id || '';
    const addedNew = Boolean(topId && topId !== prevTopId);
    prevTopId = topId;
    list.value = next;
    await nextTick();
    refresh(addedNew);
  });
});

watch(
  () => [props.position, props.max, props.expanded],
  () => nextTick(() => refresh(false)),
);

onBeforeUnmount(() => {
  stopSub?.();
  stopInteract?.();
  stopHost?.();
});
</script>

<template>
  <div
    ref="el"
    class="j-toaster"
    popover="manual"
    role="region"
    aria-label="Notifications"
    :data-position="position === 'bottom-end' ? undefined : position"
    :data-expanded="expanded ? '' : undefined"
    v-bind="$attrs"
  >
    <div
      v-for="item in list"
      :key="item.id"
      class="j-toast"
      :role="item.tone === 'danger' ? 'alert' : 'status'"
      :aria-live="item.tone === 'danger' ? 'assertive' : 'polite'"
      :data-tone="item.tone"
      :data-state="item.state"
    >
      <div class="j-toast__inner">
        <span class="j-toast__indicator" aria-hidden="true">
          <svg
            v-if="item.tone === 'success'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="m5.5 8.2 1.7 1.7 3.4-3.7" />
          </svg>
          <svg
            v-else-if="item.tone === 'danger'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 5.2v3.3M8 10.8h.01" />
          </svg>
          <svg
            v-else-if="item.tone === 'warning'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 2.4 14.2 13a.8.8 0 0 1-.7 1.2H2.5a.8.8 0 0 1-.7-1.2L8 2.4Z" />
            <path d="M8 6.5v3M8 11.6h.01" />
          </svg>
          <svg
            v-else-if="item.tone === 'info'"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M8 7.4v3.4M8 5.2h.01" />
          </svg>
          <span v-else class="j-toast__dot" />
        </span>

        <div class="j-toast__body">
          <p class="j-toast__title">{{ item.title }}</p>
          <p v-if="item.description" class="j-toast__description">{{ item.description }}</p>
        </div>

        <div v-if="item.action || item.closable" class="j-toast__actions">
          <button
            v-if="item.action"
            type="button"
            class="j-toast__action"
            @click="onAction(item)"
          >
            {{ item.action.label }}
          </button>
          <button
            v-if="item.closable"
            type="button"
            class="j-toast__close"
            aria-label="Dismiss notification"
            @click="dismissToast(item.id)"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
