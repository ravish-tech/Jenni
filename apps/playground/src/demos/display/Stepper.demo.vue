<script lang="ts">
export const meta = {
  name: 'Stepper',
  group: 'Display',
  order: 15,
  description: 'Horizontal and vertical multi-step progress rails with 300ms emphasized connector fills and linear gating.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JStepper,
  JStep,
  JCard,
  JButton,
  JBadge,
  JStack,
  JInline,
  JGrid,
  type JStepItem,
} from 'jenni-vue';

const activeStep = ref(1);

const onboardingSteps: JStepItem[] = [
  { title: 'Organization', description: 'Workspace slug & SSO domain' },
  { title: 'Region & Residency', description: 'Primary KMS & sovereign storage' },
  { title: 'Access Policy', description: 'Role bindings & hardware keys' },
  { title: 'Verification', description: 'Audit dry-run & activation' },
];

const stepSummaries = [
  'Organization identity verified for acme-corp.internal with SAML 2.0 metadata.',
  'Select primary replication topology across US-East (iad1) and EU-Central (fra1).',
  'Configure hardware WebAuthn enforcement and session lifetime bounds.',
  'Review cryptographic attestation log before promoting workspace to production.',
];

const linearStep = ref(1);

const html = `<ol class="j-stepper" aria-label="Deployment progress">
  <li class="j-stepper__step" data-status="complete">
    <div class="j-stepper__trigger">
      <span class="j-stepper__indicator" aria-hidden="true"></span>
      <span class="j-stepper__body">
        <span class="j-stepper__title">Build image</span>
        <span class="j-stepper__description">Signed OCI manifest</span>
      </span>
    </div>
    <div class="j-stepper__connector" aria-hidden="true">
      <span class="j-stepper__connector-fill"></span>
    </div>
  </li>
  <li class="j-stepper__step" data-status="current" aria-current="step">
    <div class="j-stepper__trigger">
      <span class="j-stepper__indicator" aria-hidden="true">2</span>
      <span class="j-stepper__body">
        <span class="j-stepper__title">Canary rollout</span>
        <span class="j-stepper__description">10% regional traffic</span>
      </span>
    </div>
    <div class="j-stepper__connector" aria-hidden="true">
      <span class="j-stepper__connector-fill"></span>
    </div>
  </li>
  <li class="j-stepper__step" data-status="upcoming">
    <div class="j-stepper__trigger">
      <span class="j-stepper__indicator" aria-hidden="true">3</span>
      <span class="j-stepper__body">
        <span class="j-stepper__title">Global promote</span>
        <span class="j-stepper__description">100% traffic cutover</span>
      </span>
    </div>
  </li>
</ol>`;
</script>

<template>
  <DemoSection
    title="Interactive horizontal stepper"
    description="Click any step or use the controls below to watch the hairline rail fill with 300ms emphasized motion."
  >
    <JStack gap="field" style="width:100%">
      <JStepper v-model="activeStep" :steps="onboardingSteps" clickable />

      <JCard size="sm" footer-divider>
        <JStack gap="inline">
          <JInline gap="related" align="center">
            <JBadge size="sm" variant="soft">Step {{ activeStep + 1 }} of {{ onboardingSteps.length }}</JBadge>
            <strong style="font-size:var(--j-text-sm);color:var(--j-fg)">{{ onboardingSteps[activeStep]?.title }}</strong>
          </JInline>
          <p style="margin:0;font-size:var(--j-text-sm);color:var(--j-fg-muted)">
            {{ stepSummaries[activeStep] }}
          </p>
        </JStack>
        <template #footer>
          <JInline justify="between" align="center" style="width:100%">
            <JButton
              variant="outline"
              size="sm"
              :disabled="activeStep <= 0"
              @click="activeStep = Math.max(0, activeStep - 1)"
            >
              Previous
            </JButton>
            <JButton
              size="sm"
              :disabled="activeStep >= onboardingSteps.length - 1"
              @click="activeStep = Math.min(onboardingSteps.length - 1, activeStep + 1)"
            >
              {{ activeStep === onboardingSteps.length - 1 ? 'Completed' : 'Continue' }}
            </JButton>
          </JInline>
        </template>
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Linear gating & error validation state"
    description="Compound <JStep> children supporting linear progression locks and explicit error status."
  >
    <JStack gap="group" style="width:100%">
      <JStack gap="item">
        <JInline justify="between" align="center">
          <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Linear clickable stepper (unlocks sequentially as you advance)</span>
          <JInline gap="inline">
            <JButton variant="ghost" size="sm" :disabled="linearStep <= 0" @click="linearStep--">Back</JButton>
            <JButton variant="outline" size="sm" :disabled="linearStep >= 3" @click="linearStep++">Unlock next</JButton>
          </JInline>
        </JInline>
        <JStepper v-model="linearStep" clickable linear size="sm">
          <JStep title="Schema check" description="Validated 42 models" />
          <JStep title="Zero-downtime plan" description="Shadow table diff" />
          <JStep title="Backfill batch" description="1.2M rows queued" />
          <JStep title="Swapread pointer" description="Atomic cutover" />
        </JStepper>
      </JStack>

      <JStack gap="item">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Validation error status</span>
        <JStepper :model-value="2" size="md">
          <JStep title="Artifact build" description="sha256:9f82c1" status="complete" />
          <JStep title="Signature check" description="Attestation expired" status="error" />
          <JStep title="Edge propagation" description="Blocked on policy" status="upcoming" />
        </JStepper>
      </JStack>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Vertical orientation & sizes"
    description="Ideal for deployment logs, setup checklists, and side-rail onboarding."
  >
    <JGrid :min-cell-width="260" gap="group" style="width:100%">
      <JCard size="sm" title="Release pipeline · v2.14.0" description="Vertical stepper (default md)">
        <JStepper :model-value="2" orientation="vertical" tone="success">
          <JStep title="Compile TypeScript & CSS layers" description="Completed in 1.8s · zero warnings" />
          <JStep title="Run Playwright visual matrix" description="128 snapshots verified across light & dark" />
          <JStep title="Canary traffic shift (25%)" description="Monitoring error budget for 5 minutes…" />
          <JStep title="Promote global edge POPs" description="Awaiting canary health gate" />
        </JStepper>
      </JCard>

      <JCard size="sm" title="Large scale · lg" description="Architectural onboarding rail">
        <JStepper :model-value="1" orientation="vertical" size="lg">
          <JStep title="Connect Git provider" description="GitHub App installed on 14 repositories." />
          <JStep title="Configure build cache" description="Provisioning distributed remote cache." />
          <JStep title="Invite engineering team" description="Syncing SCIM directory groups." />
        </JStepper>
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
