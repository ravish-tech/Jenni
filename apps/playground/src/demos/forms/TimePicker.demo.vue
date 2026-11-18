<script lang="ts">
export const meta = {
  name: 'Time Picker',
  group: 'Forms',
  order: 17,
  description: 'Tabular-numeral segmented spinbutton with numeric auto-advance and anchored column picker.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JField, JInline, JStack, JTimePicker } from 'jenni-vue';

const deployTime = ref<string | null>('14:30');
const standupTime = ref<string | null>('09:15');
const auditTimestamp = ref<string | null>('22:08:45');
const slotStart = ref<string | null>('10:00');
const slotEnd = ref<string | null>('11:30');

const sizeTimes = reactive<{
  sm: string | null;
  md: string | null;
  lg: string | null;
  invalid: string | null;
}>({
  sm: '08:00',
  md: '13:45',
  lg: '19:30',
  invalid: null,
});

const html = `<div class="j-time-picker" data-format="24h" data-value="14:30" style="max-width:220px">
  <div class="j-time-picker__segments" role="group" aria-label="Time">
    <button type="button" role="spinbutton" class="j-time-picker__segment" data-segment="hour">14</button>
    <span class="j-time-picker__sep" aria-hidden="true">:</span>
    <button type="button" role="spinbutton" class="j-time-picker__segment" data-segment="minute">30</button>
  </div>
  <div class="j-time-picker__controls">
    <button type="button" class="j-time-picker__clear" aria-label="Clear">×</button>
    <button type="button" class="j-time-picker__trigger" popovertarget="tp-pop" aria-label="Pick time">🕒</button>
  </div>
</div>
<div id="tp-pop" class="j-time-picker__popover" popover="auto"></div>`;
</script>

<template>
  <DemoSection
    title="24-Hour, 12-Hour & Seconds"
    description="Type digits directly (e.g. 1 → 4 jumps to minutes), step with ArrowUp/Down, or open the column popover."
  >
    <JInline gap="group" wrap style="width: 100%; align-items: flex-start">
      <JField label="Deployment window (24h)" :hint="`Canonical value: ${deployTime ?? 'null'}`" style="width: 240px">
        <JTimePicker v-model="deployTime" format="24h" />
      </JField>

      <JField label="Daily standup (12h · 15m step)" :hint="`Canonical value: ${standupTime ?? 'null'}`" style="width: 240px">
        <JTimePicker v-model="standupTime" format="12h" :minute-step="15" />
      </JField>

      <JField label="Log cutover (with seconds)" :hint="`Canonical value: ${auditTimestamp ?? 'null'}`" style="width: 240px">
        <JTimePicker v-model="auditTimestamp" format="24h" seconds />
      </JField>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Schedule Block Composition"
    description="Paired start/end spinbuttons with 15-minute increments for calendar event inspectors."
  >
    <JCard title="Design review session" size="sm" style="width: 100%; max-width: 440px">
      <JStack gap="field">
        <JInline gap="item" style="width: 100%">
          <JField label="Starts" style="flex: 1">
            <JTimePicker v-model="slotStart" format="12h" :minute-step="15" size="sm" />
          </JField>
          <JField label="Ends" style="flex: 1">
            <JTimePicker v-model="slotEnd" format="12h" :minute-step="15" size="sm" />
          </JField>
        </JInline>
        <div
          style="
            padding: var(--j-space-2) var(--j-space-3);
            border-radius: var(--j-radius-sm);
            background: var(--j-surface-2);
            border: 1px solid var(--j-border);
            font-size: var(--j-text-xs);
            color: var(--j-fg-muted);
            font-variant-numeric: tabular-nums;
          "
        >
          Scheduled window: {{ slotStart ?? '--:--' }} → {{ slotEnd ?? '--:--' }} UTC
        </div>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection
    title="Sizes & States"
    description="sm · md · lg heights, invalid validation ring, and disabled lock."
  >
    <JStack gap="item" style="width: 100%; max-width: 260px">
      <JTimePicker v-model="sizeTimes.sm" size="sm" aria-label="Small time picker" />
      <JTimePicker v-model="sizeTimes.md" aria-label="Medium time picker" />
      <JTimePicker v-model="sizeTimes.lg" size="lg" format="12h" aria-label="Large time picker" />
      <JField label="Cutoff time" :invalid="!sizeTimes.invalid" error="Cutoff time is required.">
        <JTimePicker v-model="sizeTimes.invalid" :invalid="!sizeTimes.invalid" />
      </JField>
      <JTimePicker model-value="17:00" disabled aria-label="Disabled time picker" />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Plain HTML"
    description="initTimePickers() wires spinbutton keyboard stepping, digit auto-advance, and the anchored column popover."
  >
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
