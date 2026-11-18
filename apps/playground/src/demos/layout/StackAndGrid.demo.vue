<script lang="ts">
export const meta = {
  name: 'Stack & Inline',
  group: 'Layout',
  order: 5,
  description: '1D Flexbox vertical stacks, horizontal inline clusters, and six semantic relationship gaps.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JStack,
  JInline,
  JGrid,
  JCard,
  JButton,
  JBadge,
  JKbd,
  JAvatar,
  JField,
  JInput,
  type JGap,
} from 'jenni-vue';

const activeGap = ref<JGap>('related');
const minWidth = ref(180);

const gaps: Array<{ name: JGap; px: string; role: string }> = [
  { name: 'inline', px: '6px', role: 'Icon + label, status dot + badge, text + Kbd' },
  { name: 'related', px: '8px', role: 'Sibling buttons (Cancel + Save), filter chips, toolbar cluster' },
  { name: 'item', px: '12px', role: 'Internal row/card slots: Avatar + Title + Action' },
  { name: 'field', px: '16px', role: 'Vertical stack of form Fields (JStack default)' },
  { name: 'group', px: '24px', role: 'Card grid gutter & distinct sub-groups (JGrid default)' },
  { name: 'section', px: '40px', role: 'Major vertical rhythm between Page Sections' },
];

const html = `<div class="j-stack" data-gap="field">
  <div class="j-field">
    <label class="j-label" for="email">Work email</label>
    <input id="email" class="j-input" placeholder="you@company.com" />
  </div>
  <div class="j-inline" data-gap="related" data-justify="end">
    <button class="j-button" data-variant="outline" data-tone="neutral">Cancel</button>
    <button class="j-button">Continue</button>
  </div>
</div>

<div class="j-grid" style="--j-grid-min: 220px" data-gap="group">
  <article class="j-card">…</article>
  <article class="j-card">…</article>
  <article class="j-card">…</article>
</div>`;
</script>

<template>
  <DemoSection
    title="Six Semantic Relationship Gaps"
    description="Spacing between elements is chosen by how closely they belong together — never arbitrary pixel guesses."
  >
    <JStack gap="group" style="width: 100%">
      <JInline gap="inline">
        <JButton
          v-for="g in gaps"
          :key="g.name"
          size="sm"
          :variant="activeGap === g.name ? 'solid' : 'outline'"
          :tone="activeGap === g.name ? 'accent' : 'neutral'"
          @click="activeGap = g.name"
        >
          {{ g.name }} ({{ g.px }})
        </JButton>
      </JInline>

      <JCard variant="outline">
        <JStack gap="item">
          <div style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
            Live preview with <code>gap="{{ activeGap }}"</code>:
            <strong style="color: var(--j-fg)">{{ gaps.find((x) => x.name === activeGap)?.role }}</strong>
          </div>
          <JInline :gap="activeGap">
            <JButton size="sm" variant="outline" tone="neutral">Cancel</JButton>
            <JButton size="sm" variant="soft">Preview</JButton>
            <JButton size="sm">Publish changes</JButton>
          </JInline>
        </JStack>
      </JCard>

      <JGrid :min-cell-width="260" gap="item">
        <JCard size="sm" title="inline (6px)" description="Tightly bound peers">
          <JInline gap="inline">
            <JBadge dot tone="success">Operational</JBadge>
            <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Search</span>
            <JKbd size="sm">⌘K</JKbd>
          </JInline>
        </JCard>

        <JCard size="sm" title="related (8px)" description="Sibling action buttons">
          <JInline gap="related">
            <JButton size="sm" variant="outline" tone="neutral">Cancel</JButton>
            <JButton size="sm">Save</JButton>
          </JInline>
        </JCard>

        <JCard size="sm" title="item (12px)" description="Avatar + identity + action">
          <JInline gap="item" justify="between" style="width: 100%">
            <JInline gap="item">
              <JAvatar name="Ada Lovelace" size="sm" />
              <div>
                <div style="font-size: var(--j-text-sm); font-weight: 600">Ada Lovelace</div>
                <div style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Admin</div>
              </div>
            </JInline>
            <JButton size="sm" variant="ghost" tone="neutral">Edit</JButton>
          </JInline>
        </JCard>
      </JGrid>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Form Stack (gap='field')"
    description="JStack defaults to --j-gap-field (16px) with JInline justify='between' for form footers."
  >
    <JCard title="Create API Token" description="Tokens inherit your workspace permissions." style="width: 100%; max-width: 440px">
      <JStack gap="field">
        <JField label="Token name" required>
          <JInput placeholder="CI Deployment Runner" />
        </JField>
        <JField label="Expiration" hint="Leave blank for non-expiring service tokens.">
          <JInput placeholder="90 days" />
        </JField>
        <JInline justify="end" gap="related">
          <JButton variant="outline" tone="neutral">Cancel</JButton>
          <JButton>Generate token</JButton>
        </JInline>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection
    title="Responsive Auto-Fit Grid (minCellWidth)"
    description="JGrid defaults to gap='group' (24px) and wraps columns automatically without media queries via minCellWidth."
  >
    <JStack gap="field" style="width: 100%">
      <JInline gap="related">
        <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">minCellWidth:</span>
        <JButton
          v-for="w in [140, 180, 260, 340]"
          :key="w"
          size="sm"
          :variant="minWidth === w ? 'soft' : 'ghost'"
          :tone="minWidth === w ? 'accent' : 'neutral'"
          @click="minWidth = w"
        >
          {{ w }}px
        </JButton>
      </JInline>

      <JGrid :min-cell-width="minWidth" gap="group">
        <JCard v-for="n in 4" :key="n" size="sm" :title="`Region 0${n}`" description="Auto-fit column cell">
          <JBadge size="sm" variant="soft" tone="success">12 ms</JBadge>
        </JCard>
      </JGrid>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
