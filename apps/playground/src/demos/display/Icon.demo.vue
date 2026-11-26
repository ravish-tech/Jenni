<script lang="ts">
export const meta = {
  name: 'Icon & Registry',
  group: 'Display',
  order: 0.5,
  description: 'High-definition 24×24 vector icons with size-calibrated optical strokes (1.5–2.0), semantic tones, spin state, and pluggable app icon registry.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JIcon,
  provideIcons,
  listBuiltinIcons,
  JInput,
  JBadge,
  JCard,
  JInline,
  JStack,
} from 'jenni-vue';

// Demonstrate connecting custom app icons alongside built-in icons
provideIcons({
  'app-cube': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2.5 20.5 7.25v9.5L12 21.5 3.5 16.75v-9.5L12 2.5Z"/><path d="M12 12v9.5M12 12l8.5-4.75M12 12 3.5 7.25"/></svg>',
  'app-pulse': {
    viewBox: '0 0 24 24',
    body: '<path d="M2 12h4.5l2.8-6.5 4.4 13 2.8-6.5H22"/>',
  },
});

const query = ref('');
const allIcons = listBuiltinIcons();
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return q ? allIcons.filter((n) => n.includes(q)) : allIcons;
});

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const tones = ['neutral', 'accent', 'success', 'warning', 'danger', 'info'] as const;

const code = `import { provideIcons, registerIcons, JIcon } from 'jenni-vue';

// Connect Lucide, Tabler, or custom SVG sprites across your entire app:
registerIcons((name) => myCustomIconMap[name]);
// Or scope per subtree:
provideIcons({ 'app-cube': '<svg viewBox="0 0 16 16">...</svg>' });

// Render anywhere:
// <JIcon name="git-pull-request" size="md" tone="accent" />`;
</script>

<template>
  <DemoSection
    title="High-Definition 24×24 Optical Icon Set"
    description="130+ precision vector icons authored on a 24×24 grid with automatic optical stroke calibration across xs (12px) through xl (24px)."
  >
    <JStack gap="field" style="width: 100%">
      <JInline justify="between" wrap>
        <JInput v-model="query" size="sm" placeholder="Filter built-in icons…" style="width: 240px" />
        <JBadge variant="soft" tone="neutral">{{ filtered.length }} icons</JBadge>
      </JInline>

      <div
        style="
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
          gap: var(--j-space-2);
          width: 100%;
        "
      >
        <div
          v-for="name in filtered"
          :key="name"
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px 6px;
            border-radius: var(--j-radius-sm);
            background: var(--j-surface-2);
            box-shadow: inset 0 0 0 1px var(--j-border);
          "
        >
          <JIcon :name="name" size="lg" />
          <span style="font-size: 10.5px; color: var(--j-fg-muted); font-family: var(--j-font-mono); text-align: center">
            {{ name }}
          </span>
        </div>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Sizes, Tones, Spin & Custom App Registry"
    description="Connect any external icon library (Lucide, Heroicons, custom SVGs, or Vue/React components) via registerIcons or provideIcons."
  >
    <JStack gap="field">
      <JInline gap="item">
        <JIcon v-for="s in sizes" :key="s" name="git-pull-request" :size="s" tone="accent" />
      </JInline>
      <JInline gap="item">
        <JIcon v-for="t in tones" :key="t" name="check-circle" size="lg" :tone="t" />
        <JIcon name="refresh" size="lg" tone="info" spin label="Syncing" />
      </JInline>
      <JCard size="sm" variant="outline" style="max-width: 420px">
        <JInline gap="item">
          <JIcon name="app-cube" size="xl" tone="accent" />
          <JIcon name="app-pulse" size="xl" tone="success" />
          <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
            Custom icons resolved dynamically via <code>provideIcons(...)</code>
          </span>
        </JInline>
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection title="Usage">
    <DemoCode lang="vue" :code="code" code-only />
  </DemoSection>
</template>
