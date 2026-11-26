<script lang="ts">
export const meta = {
  name: 'Field',
  group: 'Forms',
  order: 4,
  description: 'Label + control + hint + error. Wires id, aria-describedby and aria-invalid for you.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JButton,
  JCard,
  JCheckbox,
  JField,
  JInline,
  JInput,
  JLabel,
  JRadio,
  JRadioGroup,
  JSelect,
  JSlider,
  JStack,
  JSwitch,
  JTextarea,
} from 'jenni-vue';

const email = ref('');
const touched = ref(false);
const emailError = computed(() =>
  touched.value && !/^\S+@\S+\.\S+$/.test(email.value) ? 'Enter a valid email address.' : undefined,
);

const name = ref('Ravish');
const role = ref<string | number>('');
const team = ref('design');
const seats = ref(5);
const welcome = ref(true);
const agree = ref(false);
const submitted = ref(false);
const submitting = ref(false);
function submit() {
  submitted.value = true;
  if (!agree.value || !role.value) return;
  submitting.value = true;
  setTimeout(() => (submitting.value = false), 1400);
}

const html = `<div class="j-field" style="width:100%;max-width:360px">
  <label class="j-label" for="f-email" data-required>Email</label>
  <input class="j-input" id="f-email" type="email" aria-describedby="f-email-error" aria-invalid="true" value="ravish@">
  <p class="j-field__hint" id="f-email-hint">We'll never share it.</p>
  <p class="j-field__error" id="f-email-error">Enter a valid email address.</p>
</div>`;
</script>

<template>
  <DemoSection title="Basic" description="Label, hint, required marker.">
    <JStack gap="field" style="width: 100%; max-width: 380px">
      <JField label="Display name" hint="Shown on your profile and in comments.">
        <JInput v-model="name" />
      </JField>
      <JField label="Bio" hint="Markdown supported.">
        <JTextarea placeholder="A few words about you" />
      </JField>
      <JStack gap="inline">
        <JLabel required>Standalone label</JLabel>
        <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">JLabel / .j-label also works alone.</span>
      </JStack>
    </JStack>
  </DemoSection>

  <DemoSection title="Validation" description="Error replaces the hint and marks the control invalid.">
    <JStack gap="field" style="width: 100%; max-width: 380px">
      <JField label="Email" hint="We'll never share it." :error="emailError" required>
        <JInput v-model="email" type="email" placeholder="you@company.com" @blur="touched = true" />
      </JField>
      <JField label="Username" error="That username is taken.">
        <JInput model-value="ravish">
          <template #prefix>@</template>
        </JInput>
      </JField>
    </JStack>
  </DemoSection>

  <DemoSection title="States">
    <JStack gap="field" style="width: 100%; max-width: 380px">
      <JField label="Disabled field" hint="Contact an admin to change this." disabled>
        <JInput model-value="acme-inc" />
      </JField>
      <JField label="Workspace URL" hint="Read-only once created.">
        <JInput model-value="acme" readonly>
          <template #prefix>acme.dev/</template>
        </JInput>
      </JField>
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="A complete invite form composed with JCard, JStack, and every Forms control.">
    <JCard
      as="form"
      title="Invite teammates"
      description="Assign workspace permissions, team membership, and monthly seat capacity."
      footer-divider
      style="width: 100%; max-width: 440px"
      @submit.prevent="submit"
    >
      <JStack gap="field">
        <JField label="Email" required>
          <JInput type="email" placeholder="name@company.com" />
        </JField>
        <JField label="Role" required :error="submitted && !role ? 'Pick a role.' : undefined">
          <JSelect v-model="role" placeholder="Choose a role" :options="['Admin', 'Member', 'Viewer']" />
        </JField>
        <JField label="Team">
          <JRadioGroup v-model="team" orientation="horizontal">
            <JRadio value="design">Design</JRadio>
            <JRadio value="eng">Engineering</JRadio>
            <JRadio value="ops">Ops</JRadio>
          </JRadioGroup>
        </JField>
        <JField :label="`Seats: ${seats}`" hint="Billed monthly per seat.">
          <JSlider v-model="seats" :min="1" :max="50" />
        </JField>
        <JSwitch v-model="welcome" placement="end" label="Send welcome email" description="Include workspace onboarding instructions." />
        <JCheckbox v-model="agree" :invalid="submitted && !agree">I confirm these people work at my company</JCheckbox>
      </JStack>
      <template #footer>
        <JInline gap="related" justify="end" style="width: 100%">
          <JButton variant="ghost" type="reset">Cancel</JButton>
          <JButton type="submit" :loading="submitting">Send invites</JButton>
        </JInline>
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
