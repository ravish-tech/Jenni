<script lang="ts">
export const meta = {
  name: 'Number Input',
  group: 'Forms',
  order: 7,
  description: 'Tabular-numeral spinbutton with hairline steppers, units, Shift×10, and clamp-on-blur.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JField, JInline, JNumberInput, JStack } from 'jenni-vue';

const quantity = ref<number | null>(4);
const seats = ref<number | null>(12);
const budget = ref<number | null>(250);
const opacity = ref<number | null>(85);
const radius = ref<number | null>(8);
const duration = ref<number | null>(220);
const sizeNums = reactive<{ sm: number | null; md: number | null; lg: number | null; invalid: number | null }>({
  sm: 12,
  md: 16,
  lg: 24,
  invalid: -5,
});

const html = `<div class="j-stack" data-gap="item" style="width:100%;max-width:280px">
  <div class="j-number-input">
    <span class="j-number-input__addon">$</span>
    <input type="text" inputmode="decimal" class="j-number-input__field" value="120" min="0" max="1000" step="10" aria-label="Amount">
    <div class="j-number-input__controls">
      <button type="button" class="j-number-input__btn" data-step="down" aria-label="Decrease">−</button>
      <button type="button" class="j-number-input__btn" data-step="up" aria-label="Increase">+</button>
    </div>
  </div>
  <div class="j-number-input" data-controls="split">
    <button type="button" class="j-number-input__btn" data-step="down" aria-label="Decrease">−</button>
    <input type="text" inputmode="decimal" class="j-number-input__field" value="3" min="1" max="20" aria-label="Quantity">
    <button type="button" class="j-number-input__btn" data-step="up" aria-label="Increase">+</button>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Controls Layout" description="End-aligned hairline steppers (default) or centered split counter. Hold Shift for 10× step.">
    <JStack gap="field" style="width: 100%; max-width: 300px">
      <JField label="Team seats" hint="Min 1, max 50 · ArrowUp/Down supported">
        <JNumberInput v-model="seats" :min="1" :max="50" />
      </JField>
      <JField label="Order quantity (split)">
        <JNumberInput v-model="quantity" controls="split" :min="1" :max="99" />
      </JField>
    </JStack>
  </DemoSection>

  <DemoSection title="Units & Adornments" description="Prefix and suffix units keep tabular numerals aligned.">
    <JStack gap="item" style="width: 100%; max-width: 300px">
      <JNumberInput v-model="budget" prefix="$" suffix="USD" :min="0" :step="25" aria-label="Monthly budget" />
      <JNumberInput v-model="opacity" suffix="%" :min="0" :max="100" :step="5" aria-label="Layer opacity" />
      <JNumberInput v-model="duration" suffix="ms" :min="0" :max="1000" :step="10" aria-label="Transition duration" />
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes & States" description="sm · md · lg, invalid, and disabled.">
    <JStack gap="item" style="width: 100%; max-width: 300px">
      <JNumberInput v-model="sizeNums.sm" size="sm" suffix="px" aria-label="Small" />
      <JNumberInput v-model="sizeNums.md" suffix="px" aria-label="Medium" />
      <JNumberInput v-model="sizeNums.lg" size="lg" suffix="px" aria-label="Large" />
      <JNumberInput v-model="sizeNums.invalid" :min="0" :invalid="(sizeNums.invalid ?? 0) < 0" aria-label="Invalid" />
      <JNumberInput :model-value="42" disabled aria-label="Disabled" />
    </JStack>
  </DemoSection>

  <DemoSection title="Inspector Composition" description="Precision property grid driving live preview geometry.">
    <JCard title="Corner & Opacity" size="sm" style="width: 100%; max-width: 380px">
      <JStack gap="field">
        <JInline gap="item" style="width: 100%">
          <JField label="Radius" style="flex: 1">
            <JNumberInput v-model="radius" size="sm" suffix="px" :min="0" :max="28" />
          </JField>
          <JField label="Opacity" style="flex: 1">
            <JNumberInput v-model="opacity" size="sm" suffix="%" :min="10" :max="100" :step="5" />
          </JField>
        </JInline>
        <div
          :style="{
            height: '56px',
            borderRadius: `${radius ?? 0}px`,
            opacity: (opacity ?? 100) / 100,
            background: 'var(--j-accent-soft)',
            border: '1px solid color-mix(in oklch, var(--j-accent) 40%, var(--j-border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--j-accent-soft-fg)',
            fontSize: 'var(--j-text-xs)',
            fontVariantNumeric: 'tabular-nums',
          }"
        >
          radius {{ radius ?? 0 }}px · opacity {{ opacity ?? 100 }}%
        </div>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML" description="initNumberInputs() attaches stepping, Shift×10, and blur clamping.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
