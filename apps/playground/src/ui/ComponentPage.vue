<script setup lang="ts">
import { computed, onErrorCaptured, provide, ref, toRef, watch } from 'vue';
import Icon from './Icon.vue';
import StatusPill from './StatusPill.vue';
import { DEMO_CONTEXT, sectionId } from '@/kit/context';
import { openCount } from '@/lib/feedback';
import type { DemoEntry, PlannedEntry } from '@/lib/registry';

const props = defineProps<{ demo: DemoEntry | null; planned: PlannedEntry | null; slug: string }>();

const name = computed(() => props.demo?.name ?? props.planned?.name ?? props.slug);
const sections = ref<string[]>([]);

provide(DEMO_CONTEXT, {
  component: name,
  sections,
  register(title) { if (!sections.value.includes(title)) sections.value.push(title); },
  unregister(title) { sections.value = sections.value.filter((t) => t !== title); },
});

// Keep a broken demo from taking down the whole shell.
const demoError = ref<string | null>(null);
onErrorCaptured((err) => {
  demoError.value = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  console.error(err);
  return false;
});
watch(toRef(props, 'slug'), () => { demoError.value = null; sections.value = []; });

const open = computed(() => openCount(name.value));

function jump(title: string) {
  document.getElementById(sectionId(title))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <article class="pg-page" :class="{ 'is-wide': demo?.wide === true, 'is-full': demo?.wide === 'full' }">
    <header class="pg-page__head">
      <p class="pg-eyebrow">{{ demo?.group ?? planned?.group ?? 'Unknown' }}</p>
      <div class="pg-page__title-row">
        <h1 class="pg-page__title">{{ name }}</h1>
        <StatusPill :status="demo?.status ?? 'planned'" />
        <span v-if="open" class="pg-pill is-notes"><Icon name="message" :size="12" /> {{ open }} open</span>
      </div>
      <p v-if="demo?.description || planned?.description" class="pg-page__lede">{{ demo?.description || planned?.description }}</p>
      <p v-if="demo?.missingMeta" class="pg-callout is-warning">
        This demo has no <code>meta</code> export. Add one in <code>{{ demo.file }}</code> (see ARCHITECTURE.md).
      </p>

      <nav v-if="sections.length > 1" class="pg-toc" aria-label="Sections">
        <button v-for="s in sections" :key="s" class="pg-toc__item" @click="jump(s)">{{ s }}</button>
      </nav>
    </header>

    <div v-if="demoError" class="pg-callout is-danger">
      <strong>This demo crashed.</strong>
      <code>{{ demoError }}</code>
      <span>See the console. Fix it in <code>{{ demo?.file }}</code>.</span>
    </div>

    <div v-else-if="demo?.component" :key="slug" class="pg-demo">
      <component :is="demo.component" />
    </div>

    <div v-else-if="demo" class="pg-empty">
      <Icon name="code" :size="20" />
      <p>The demo file has no default export.</p>
    </div>

    <div v-else-if="planned" class="pg-empty is-planned">
      <Icon name="sparkle" :size="20" />
      <p><strong>{{ planned.name }}</strong> is planned in {{ planned.group }}.</p>
      <p class="pg-muted">Leave ideas in the feedback panel. They become the brief.</p>
    </div>

    <div v-else class="pg-empty">
      <Icon name="search" :size="20" />
      <p>No component called “{{ slug }}”.</p>
      <a class="pg-btn" data-variant="outline" href="#/">Back to overview</a>
    </div>
  </article>
</template>
