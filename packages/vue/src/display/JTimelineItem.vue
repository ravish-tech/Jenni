<script setup lang="ts">
import JIcon from './JIcon.vue';

export type TimelineTone = 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type TimelineLine = 'solid' | 'dashed';

export interface JTimelineItemProps {
  /** Event headline. */
  title?: string;
  /** Timestamp label rendered in `tabular-nums`. */
  time?: string;
  /** Secondary event summary. */
  description?: string;
  /** Semantic status tone for the step marker. */
  tone?: TimelineTone;
  /** Icon name rendered via `JIcon` inside `.j-timeline__marker`. */
  icon?: string;
  /** Highlights the current/in-flight step with an optical halo ring. */
  active?: boolean;
  /** Per-item override for the trailing vertical connector rail. */
  line?: TimelineLine;
}

defineOptions({ name: 'JTimelineItem' });

withDefaults(defineProps<JTimelineItemProps>(), {
  tone: 'neutral',
  active: false,
});
</script>

<template>
  <li
    class="j-timeline__item"
    :data-tone="tone === 'neutral' ? undefined : tone"
    :data-active="active ? '' : undefined"
    :data-line="line"
    :aria-current="active ? 'step' : undefined"
  >
    <div class="j-timeline__axis" aria-hidden="true">
      <div class="j-timeline__marker-wrap">
        <span class="j-timeline__marker">
          <slot name="dot">
            <JIcon v-if="icon" :name="icon" />
          </slot>
        </span>
      </div>
      <span class="j-timeline__rail" />
    </div>

    <div class="j-timeline__content">
      <div
        v-if="title || time || $slots.title || $slots.time"
        class="j-timeline__header"
      >
        <span v-if="title || $slots.title" class="j-timeline__title">
          <slot name="title">{{ title }}</slot>
        </span>
        <span v-if="time || $slots.time" class="j-timeline__time">
          <slot name="time">{{ time }}</slot>
        </span>
      </div>

      <p v-if="description" class="j-timeline__description">{{ description }}</p>

      <div v-if="$slots.default" class="j-timeline__details">
        <slot />
      </div>
    </div>
  </li>
</template>
