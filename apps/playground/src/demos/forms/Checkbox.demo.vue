<script lang="ts">
export const meta = {
  name: 'Checkbox',
  group: 'Forms',
  order: 11,
  description: 'Native checkbox, custom-drawn with a crisp 1.75px check and indeterminate dash.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JCheckbox, JInline, JStack } from '@jenni/vue';

const tones = ['accent', 'neutral', 'danger', 'success', 'warning', 'info'] as const;

const terms = ref(false);
const bareChecked = ref(true);
const sizeChecks = reactive({ sm: true, md: true, lg: true });
const toneChecks = reactive<Record<(typeof tones)[number], boolean>>({
  accent: true,
  neutral: true,
  danger: true,
  success: true,
  warning: true,
  info: true,
});
const items = ref([
  { label: 'Issues', on: true },
  { label: 'Pull requests', on: false },
  { label: 'Releases', on: true },
]);
const all = computed(() => items.value.every((i) => i.on));
const some = computed(() => !all.value && items.value.some((i) => i.on));
function toggleAll(v: boolean) {
  items.value.forEach((i) => (i.on = v));
}

const html = `<div class="j-stack" data-gap="item">
  <label class="j-choice">
    <input type="checkbox" class="j-checkbox" checked>
    Remember me
  </label>
  <label class="j-choice">
    <input type="checkbox" class="j-checkbox">
    <span class="j-choice__body">
      <span class="j-choice__label">Product updates</span>
      <span class="j-choice__description">A short email, once a month.</span>
    </span>
  </label>
</div>`;
</script>

<template>
  <DemoSection title="Basic" description="Crisp 1.75px stroke with a calm 220ms fade-and-settle transition.">
    <JStack gap="item">
      <JCheckbox v-model="terms">I agree to the terms ({{ terms ? 'yes' : 'no' }})</JCheckbox>
      <JCheckbox label="Email me about product updates" description="A short note, once a month. Unsubscribe anytime." />
      <JInline gap="group">
        <JCheckbox aria-label="Bare checkbox" />
        <JCheckbox v-model="bareChecked" aria-label="Checked" />
        <JCheckbox indeterminate aria-label="Indeterminate" />
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes">
    <JInline gap="group">
      <JCheckbox v-model="sizeChecks.sm" size="sm">Small</JCheckbox>
      <JCheckbox v-model="sizeChecks.md">Medium</JCheckbox>
      <JCheckbox v-model="sizeChecks.lg" size="lg">Large</JCheckbox>
    </JInline>
  </DemoSection>

  <DemoSection title="Tones">
    <JInline gap="group">
      <JCheckbox v-for="t in tones" :key="t" v-model="toneChecks[t]" :tone="t">{{ t }}</JCheckbox>
    </JInline>
  </DemoSection>

  <DemoSection title="States" description="Hover, focus (Tab), invalid, disabled.">
    <JStack gap="item">
      <JCheckbox invalid>Accept the terms to continue</JCheckbox>
      <JInline gap="group">
        <JCheckbox disabled>Disabled</JCheckbox>
        <JCheckbox disabled :model-value="true">Disabled checked</JCheckbox>
        <JCheckbox disabled indeterminate>Disabled mixed</JCheckbox>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="Select-all group with indeterminate parent inside JCard.">
    <JCard size="sm" style="width: 100%; max-width: 300px">
      <JStack gap="item">
        <JCheckbox :model-value="all" :indeterminate="some" @update:model-value="toggleAll">Notify me about</JCheckbox>
        <JStack gap="related" style="padding-inline-start: var(--j-space-6)">
          <JCheckbox v-for="i in items" :key="i.label" v-model="i.on">{{ i.label }}</JCheckbox>
        </JStack>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
