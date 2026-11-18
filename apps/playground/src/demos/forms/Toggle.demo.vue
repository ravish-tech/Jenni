<script lang="ts">
export const meta = {
  name: 'Toggle',
  group: 'Forms',
  order: 2,
  description: 'Stateful press button and single/multiple toggle groups with zero scale squish.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JInline, JStack, JToggle, JToggleGroup } from 'jenni-vue';

const pinned = ref(true);
const muted = ref(false);
const starred = ref(true);
const align = ref<string | null>('left');
const marks = ref<string[]>(['bold', 'italic']);
const filters = ref<string[]>(['bugs', 'design']);

const variants = ['outline', 'ghost', 'soft'] as const;
const tones = ['accent', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const variantOff = reactive<Record<(typeof variants)[number], boolean>>({ outline: false, ghost: false, soft: false });
const variantOn = reactive<Record<(typeof variants)[number], boolean>>({ outline: true, ghost: true, soft: true });
const toneToggles = reactive<Record<(typeof tones)[number], boolean>>({
  accent: true,
  neutral: true,
  success: true,
  warning: true,
  danger: true,
  info: true,
});

const html = `<div class="j-inline" data-gap="item">
  <button type="button" class="j-toggle" aria-pressed="true">Pinned</button>
  <div class="j-toggle-group" role="group" data-type="multiple" data-attached aria-label="Text formatting">
    <button type="button" class="j-toggle" data-icon-only aria-pressed="true" aria-label="Bold"><strong>B</strong></button>
    <button type="button" class="j-toggle" data-icon-only aria-pressed="false" aria-label="Italic"><em>I</em></button>
    <button type="button" class="j-toggle" data-icon-only aria-pressed="false" aria-label="Underline"><u>U</u></button>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Variants" description="outline (default) · ghost · soft, unpressed and pressed.">
    <JStack gap="item" align="center">
      <JInline gap="item" justify="center">
        <JToggle v-for="v in variants" :key="`off-${v}`" v-model="variantOff[v]" :variant="v">
          {{ v[0].toUpperCase() + v.slice(1) }}
        </JToggle>
      </JInline>
      <JInline gap="item" justify="center">
        <JToggle v-for="v in variants" :key="`on-${v}`" v-model="variantOn[v]" :variant="v">
          {{ v[0].toUpperCase() + v.slice(1) }} (on)
        </JToggle>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes & Icon-Only" description="sm · md · lg with crisp square icon-only buttons.">
    <JInline gap="item" justify="center" align="center">
      <JToggle v-model="pinned" size="sm">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9.5 2.5l4 4-2.5 2.5-.5 3-2.5-2.5-4 4m5.5-11-2.5 2.5-3 .5 2.5 2.5" />
        </svg>
        Pin
      </JToggle>
      <JToggle v-model="muted">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M3 6.5h2.5L9 3.5v9l-3.5-3H3v-3Z" />
          <path v-if="!muted" d="M11.5 5.5a3.5 3.5 0 0 1 0 5" />
          <path v-else d="M11 6l3 4m0-4l-3 4" />
        </svg>
        {{ muted ? 'Muted' : 'Sound on' }}
      </JToggle>
      <JToggle v-model="starred" size="lg" variant="soft" tone="warning" icon-only aria-label="Star item">
        <svg viewBox="0 0 16 16" :fill="starred ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">
          <path d="M8 2.2l1.75 3.55 3.92.57-2.84 2.76.67 3.9L8 11.14 4.5 12.98l.67-3.9L2.33 6.32l3.92-.57L8 2.2Z" />
        </svg>
      </JToggle>
    </JInline>
  </DemoSection>

  <DemoSection title="Tones" description="Explicit data-tone applies composed soft chroma when pressed.">
    <JInline gap="related" justify="center">
      <JToggle v-for="t in tones" :key="t" v-model="toneToggles[t]" :tone="t">{{ t }}</JToggle>
    </JInline>
  </DemoSection>

  <DemoSection title="Toggle Groups" description="Attached formatting toolbar (multiple + single) or detached filter pills.">
    <JCard size="sm" style="width: 100%; max-width: 440px">
      <JStack gap="field">
        <JInline gap="item" justify="between" align="center">
          <JToggleGroup v-model="marks" type="multiple" attached size="sm" aria-label="Formatting">
            <JToggle value="bold" icon-only aria-label="Bold"><strong>B</strong></JToggle>
            <JToggle value="italic" icon-only aria-label="Italic"><em>I</em></JToggle>
            <JToggle value="underline" icon-only aria-label="Underline"><u>U</u></JToggle>
            <JToggle value="code" icon-only aria-label="Monospace">
              <span style="font-family: var(--j-font-mono); font-size: var(--j-text-xs)">&lt;/&gt;</span>
            </JToggle>
          </JToggleGroup>

          <JToggleGroup v-model="align" type="single" attached size="sm" disallow-empty aria-label="Text alignment">
            <JToggle value="left" icon-only aria-label="Align left">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4.5h11M2.5 8h7M2.5 11.5h9" /></svg>
            </JToggle>
            <JToggle value="center" icon-only aria-label="Align center">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4.5h11M4.5 8h7M3.5 11.5h9" /></svg>
            </JToggle>
            <JToggle value="right" icon-only aria-label="Align right">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2.5 4.5h11M6.5 8h7M4.5 11.5h9" /></svg>
            </JToggle>
          </JToggleGroup>
        </JInline>

        <JToggleGroup v-model="filters" type="multiple" variant="soft" tone="accent" size="sm" aria-label="Issue labels">
          <JToggle value="bugs">Bugs</JToggle>
          <JToggle value="design">Design</JToggle>
          <JToggle value="perf">Performance</JToggle>
          <JToggle value="docs">Docs</JToggle>
        </JToggleGroup>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML" description="initToggles() wires aria-pressed state for standalone buttons and single/multiple groups.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
