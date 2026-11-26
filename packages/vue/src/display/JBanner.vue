<script setup lang="ts">
import { computed } from 'vue';
import JIcon from './JIcon.vue';

export type BannerTone = 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type BannerVariant = 'soft' | 'solid' | 'surface';
export type BannerAlign = 'start' | 'center';

export interface JBannerProps {
  /** Semantic tone palette. */
  tone?: BannerTone;
  /** Visual fill & border treatment. */
  variant?: BannerVariant;
  /** Edge-to-edge mode (`border-radius: 0; border-inline: 0; border-top: 0;`) for shell top bars. */
  flush?: boolean;
  /** Content alignment across the banner row. */
  align?: BannerAlign;
  /** Named `JIcon`, `true` for tone-matched icon, or `false` to hide. */
  icon?: string | boolean;
  /** Primary announcement headline. */
  title?: string;
  /** Supporting message copy when default slot is omitted. */
  description?: string;
  /** Show trailing dismiss button. */
  dismissible?: boolean;
  /** Accessible label for the dismiss button. */
  closeLabel?: string;
}

defineOptions({ name: 'JBanner' });

const props = withDefaults(defineProps<JBannerProps>(), {
  tone: 'info',
  variant: 'soft',
  flush: false,
  align: 'start',
  icon: true,
  dismissible: false,
  closeLabel: 'Dismiss banner',
});

const open = defineModel<boolean>('open', { default: true });

const emit = defineEmits<{
  dismiss: [event: MouseEvent];
}>();

const role = computed(() =>
  props.tone === 'danger' || props.tone === 'warning' ? 'alert' : 'status',
);

const resolvedIconName = computed<string | null>(() => {
  if (props.icon === false) return null;
  if (typeof props.icon === 'string' && props.icon.trim()) return props.icon.trim();
  if (props.tone === 'success') return 'check-circle';
  if (props.tone === 'warning') return 'alert-triangle';
  if (props.tone === 'danger') return 'alert-circle';
  if (props.tone === 'accent') return 'sparkles';
  return 'info';
});

function handleDismiss(event: MouseEvent) {
  open.value = false;
  emit('dismiss', event);
}
</script>

<template>
  <div
    v-if="open"
    class="j-banner"
    :role="role"
    :data-tone="tone"
    :data-variant="variant === 'soft' ? undefined : variant"
    :data-align="align === 'start' ? undefined : align"
    :data-flush="flush ? '' : undefined"
  >
    <div class="j-banner__inner">
      <span
        v-if="icon !== false && (resolvedIconName || $slots.icon)"
        class="j-banner__icon"
        aria-hidden="true"
      >
        <slot name="icon">
          <JIcon v-if="resolvedIconName" :name="resolvedIconName" size="md" />
        </slot>
      </span>

      <div
        v-if="title || description || $slots.title || $slots.default"
        class="j-banner__content"
      >
        <span v-if="title || $slots.title" class="j-banner__title">
          <slot name="title">{{ title }}</slot>
        </span>
        <span v-if="description || $slots.default" class="j-banner__description">
          <slot>{{ description }}</slot>
        </span>
      </div>

      <div v-if="$slots.actions" class="j-banner__actions">
        <slot name="actions" />
      </div>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="j-banner__close"
      :aria-label="closeLabel"
      @click="handleDismiss"
    >
      <JIcon name="x" size="sm" />
    </button>
  </div>
</template>
