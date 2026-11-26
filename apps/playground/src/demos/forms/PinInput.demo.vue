<script lang="ts">
export const meta = {
  name: 'Pin Input',
  group: 'Forms',
  order: 8,
  description: 'Monospace character cells for OTP and security codes with paste distribution.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JButton, JCard, JField, JInline, JPinInput, JStack } from 'jenni-vue';

const otp = ref('482');
const completedCode = ref('');
const sizePins = reactive({ sm: '12', md: '12', lg: '12' });
const alpha = ref('A9F2');
const masked = ref('9184');
const badPin = ref('000000');

function onComplete(code: string) {
  completedCode.value = code;
}

function fillSample() {
  otp.value = '482910';
  completedCode.value = '482910';
}

const html = `<div class="j-pin-input" role="group" aria-label="Verification code">
  <input class="j-pin-input__cell" type="text" inputmode="numeric" maxlength="1" value="4" aria-label="Digit 1">
  <input class="j-pin-input__cell" type="text" inputmode="numeric" maxlength="1" value="8" aria-label="Digit 2">
  <input class="j-pin-input__cell" type="text" inputmode="numeric" maxlength="1" placeholder="·" aria-label="Digit 3">
  <span class="j-pin-input__sep" aria-hidden="true">—</span>
  <input class="j-pin-input__cell" type="text" inputmode="numeric" maxlength="1" placeholder="·" aria-label="Digit 4">
  <input class="j-pin-input__cell" type="text" inputmode="numeric" maxlength="1" placeholder="·" aria-label="Digit 5">
  <input class="j-pin-input__cell" type="text" inputmode="numeric" maxlength="1" placeholder="·" aria-label="Digit 6">
</div>`;
</script>

<template>
  <DemoSection title="Two-Factor Verification" description="Auto-advances on input, steps back on Backspace, and distributes pasted 6-digit codes.">
    <JCard
      title="Check your authenticator"
      description="Enter the 6-digit security code or paste 482910 directly into any cell."
      footer-divider
      style="width: 100%; max-width: 400px"
    >
      <JStack gap="item" align="center">
        <JPinInput v-model="otp" separator @complete="onComplete" aria-label="Authenticator code" />
        <span style="color: var(--j-fg-muted); font-size: var(--j-text-xs); font-variant-numeric: tabular-nums">
          {{ completedCode ? `Verified code: ${completedCode}` : `Current value: "${otp || 'empty'}"` }}
        </span>
      </JStack>
      <template #footer>
        <JInline gap="related" justify="between" style="width: 100%">
          <JButton variant="ghost" size="sm" @click="otp = ''; completedCode = ''">Clear</JButton>
          <JButton variant="soft" size="sm" @click="fillSample">Fill 482910</JButton>
        </JInline>
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Sizes" description="sm (34px) · md (40px) · lg (48px).">
    <JStack gap="field" align="center">
      <JPinInput v-model="sizePins.sm" :length="4" size="sm" aria-label="Small PIN" />
      <JPinInput v-model="sizePins.md" :length="4" aria-label="Medium PIN" />
      <JPinInput v-model="sizePins.lg" :length="4" size="lg" aria-label="Large PIN" />
    </JStack>
  </DemoSection>

  <DemoSection title="Alphanumeric, Masked & States" description="Supports license keys, masked PIN dots, invalid feedback, and disabled cells.">
    <JStack gap="field" style="width: 100%; max-width: 380px">
      <JField label="Invite token (alphanumeric)">
        <JPinInput v-model="alpha" :length="6" type="alphanumeric" :separator="3" />
      </JField>
      <JField label="Hardware PIN (masked)">
        <JPinInput v-model="masked" :length="4" mask />
      </JField>
      <JField label="Invalid code" error="That code has expired. Request a new one.">
        <JPinInput v-model="badPin" separator invalid />
      </JField>
      <JField label="Disabled">
        <JPinInput model-value="739201" separator disabled />
      </JField>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML" description="initPinInputs() wires auto-advance, Backspace, arrow keys, and clipboard paste.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
