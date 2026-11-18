<script lang="ts">
export const meta = {
  name: 'Select',
  group: 'Forms',
  order: 10,
  description: 'Styled native <select>. Customizable picker where appearance: base-select is supported.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JButton, JInline, JSelect, JStack } from '@jenni/vue';

const fruit = ref<string | number>();
const region = ref<string | number>('fra1');
const fruits = ['Apple', 'Banana', 'Cherry', 'Dragonfruit', 'Elderberry'];
const regions = [
  { label: 'Washington, D.C. (iad1)', value: 'iad1' },
  { label: 'Frankfurt (fra1)', value: 'fra1' },
  { label: 'Tokyo (hnd1)', value: 'hnd1' },
  { label: 'São Paulo (gru1) — soon', value: 'gru1', disabled: true },
];

const html = `<select class="j-select" style="width:100%;max-width:280px">
  <option value="" disabled selected hidden>Pick a fruit</option>
  <option>Apple</option>
  <option>Banana</option>
  <option>Cherry</option>
</select>`;
</script>

<template>
  <DemoSection title="Basic" description="Placeholder shows muted until a value is picked. Open in Chromium 135+ to see the styled picker.">
    <JStack gap="item" style="width: 100%; max-width: 320px">
      <JSelect v-model="fruit" :options="fruits" placeholder="Pick a fruit" />
      <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Value: {{ fruit ?? '—' }}</span>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes">
    <JStack gap="item" style="width: 100%; max-width: 320px">
      <JSelect size="sm" :options="fruits" model-value="Apple" />
      <JSelect :options="fruits" model-value="Banana" />
      <JSelect size="lg" :options="fruits" model-value="Cherry" />
    </JStack>
  </DemoSection>

  <DemoSection title="Option groups (slot)">
    <JStack gap="item" style="width: 100%; max-width: 320px">
      <JSelect model-value="ts">
        <optgroup label="Frontend">
          <option value="ts">TypeScript</option>
          <option value="vue">Vue</option>
          <option value="react">React</option>
        </optgroup>
        <optgroup label="Backend">
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </optgroup>
      </JSelect>
    </JStack>
  </DemoSection>

  <DemoSection title="States" description="Focus (tone), invalid, disabled.">
    <JStack gap="item" style="width: 100%; max-width: 320px">
      <JSelect tone="success" :options="fruits" placeholder="Focus me (success tone)" />
      <JSelect invalid :options="fruits" placeholder="Required" />
      <JSelect disabled :options="fruits" model-value="Apple" />
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="Deploy region picker.">
    <JInline gap="related" nowrap style="width: 100%; max-width: 420px">
      <JSelect v-model="region" :options="regions" style="flex: 1" aria-label="Region" />
      <JButton>Deploy</JButton>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
