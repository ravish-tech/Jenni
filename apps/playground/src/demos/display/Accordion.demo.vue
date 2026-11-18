<script lang="ts">
export const meta = {
  name: 'Accordion',
  group: 'Display',
  order: 4,
  description: 'Progressive disclosure panels built on native <details> with damped 300ms height glide.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JAccordion,
  JAccordionItem,
  JCollapsible,
  JBadge,
  JCard,
  JGrid,
  JStack,
  JInline,
} from '@jenni/vue';

const activeFaq = ref('billing');
const multiOpen = ref<string[]>(['security', 'audit']);
const logsOpen = ref(false);

const faqs = [
  {
    value: 'billing',
    title: 'How does seat-based billing reconcile mid-cycle changes?',
    subtitle: 'Updated monthly',
    body: 'Added seats are prorated to the exact day of activation. Removed seats credit back automatically onto your next monthly statement with zero manual adjustment.',
  },
  {
    value: 'regions',
    title: 'Can workspaces pin data residency to a single region?',
    subtitle: 'EU & US-East',
    body: 'Yes. Enterprise workspaces can isolate database primaries, search replicas, and encrypted build artifacts strictly within Frankfurt (eu-central-1) or Virginia (us-east-1).',
  },
  {
    value: 'sso',
    title: 'Is SAML 2.0 and SCIM directory sync included?',
    subtitle: 'Identity',
    body: 'Okta, Entra ID, and Google Workspace SAML assertions are supported out of the box, with real-time SCIM group provisioning for role mapping.',
  },
] as const;

const html = `<div class="j-accordion" data-variant="card" style="width:100%;max-width:520px">
  <details class="j-accordion__item" name="html-faq" open>
    <summary class="j-accordion__trigger">
      <span class="j-accordion__title">Zero-bounce native disclosure</span>
    </summary>
    <div class="j-accordion__content">
      Uses native &lt;details name="…"&gt; with CSS ::details-content and interpolate-size for a damped 300ms glide.
    </div>
  </details>
  <details class="j-accordion__item" name="html-faq">
    <summary class="j-accordion__trigger">
      <span class="j-accordion__title">Keyboard &amp; screen-reader ready</span>
    </summary>
    <div class="j-accordion__content">
      Native &lt;summary&gt; handles Enter, Space, and focus ring semantics without framework overhead.
    </div>
  </details>
</div>`;
</script>

<template>
  <DemoSection title="Divided (default) — Exclusive v-model" description="Crisp 1px hairline rules with single-open disclosure and damped 300ms height glide.">
    <JStack gap="item" style="width:100%;max-width:580px">
      <JInline gap="related" align="center">
        <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Active panel:</span>
        <JBadge variant="outline" tone="neutral" size="sm">{{ activeFaq || 'none' }}</JBadge>
      </JInline>
      <JAccordion v-model="activeFaq">
        <JAccordionItem
          v-for="item in faqs"
          :key="item.value"
          :value="item.value"
          :title="item.title"
          :subtitle="item.subtitle"
        >
          {{ item.body }}
        </JAccordionItem>
      </JAccordion>
    </JStack>
  </DemoSection>

  <DemoSection title="Variants" description="card · separated (--j-gap-related stacked surfaces) · ghost">
    <JGrid :min-cell-width="280" gap="group" style="width:100%">
      <JStack gap="related">
        <span style="font-size:var(--j-text-xs);font-weight:var(--j-weight-medium);color:var(--j-fg-muted)">Card</span>
        <JAccordion variant="card" default-value="c1">
          <JAccordionItem value="c1" title="Build cache retention">
            Artifacts persist for 14 days on branches and 90 days on tagged releases.
          </JAccordionItem>
          <JAccordionItem value="c2" title="Parallel concurrency">
            Up to 32 isolated runners execute simultaneously per workspace queue.
          </JAccordionItem>
          <JAccordionItem value="c3" title="Custom runner images" disabled subtitle="Enterprise">
            Bring private OCI container images for specialized toolchains.
          </JAccordionItem>
        </JAccordion>
      </JStack>

      <JStack gap="related">
        <span style="font-size:var(--j-text-xs);font-weight:var(--j-weight-medium);color:var(--j-fg-muted)">Separated</span>
        <JAccordion v-model="multiOpen" variant="separated" multiple>
          <JAccordionItem value="security" title="Hardware security keys">
            <template #icon>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
            </template>
            Enforce WebAuthn passkeys before production environment promotions.
          </JAccordionItem>
          <JAccordionItem value="audit" title="Immutable audit stream">
            <template #icon>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5h11M2.5 8h11M2.5 11.5h7" /></svg>
            </template>
            Stream signed JSON events directly to your SIEM bucket every 60 seconds.
          </JAccordionItem>
        </JAccordion>
      </JStack>

      <JStack gap="related">
        <span style="font-size:var(--j-text-xs);font-weight:var(--j-weight-medium);color:var(--j-fg-muted)">Ghost (compact sm)</span>
        <JCard size="sm">
          <JAccordion variant="ghost" size="sm" default-value="g1">
            <JAccordionItem value="g1" title="Typography tokens">
              Optical sizing and tabular numerals across dense data views.
            </JAccordionItem>
            <JAccordionItem value="g2" title="Spatial rhythm">
              4px base grid scaled proportionally by the workspace density knob.
            </JAccordionItem>
            <JAccordionItem value="g3" title="Motion curves">
              Poised cubic-bezier deceleration with zero spring overshoot.
            </JAccordionItem>
          </JAccordion>
        </JCard>
      </JStack>
    </JGrid>
  </DemoSection>

  <DemoSection title="Standalone Collapsible" description="JCollapsible (.j-collapsible) for independent expandable drawers, logs, and inspector metadata.">
    <JStack gap="item" style="width:100%;max-width:520px">
      <JCollapsible v-model="logsOpen" variant="card" title="View 4 deployment environment variables">
        <template #icon>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m5 5-3 3 3 3m6-6 3 3-3 3M9.5 3.5l-3 9" /></svg>
        </template>
        <JStack gap="inline" style="font-family:var(--j-font-mono);font-size:var(--j-text-xs)">
          <div>REGION = eu-central-1</div>
          <div>LOG_LEVEL = info</div>
          <div>EDGE_CACHE_TTL = 3600</div>
          <div>STRICT_TLS = 1.3</div>
        </JStack>
      </JCollapsible>

      <JCollapsible variant="subtle" size="sm" title="Advanced compiler flags">
        Tree-shaking, dead-branch elimination, and CSS layer minification are active by default.
      </JCollapsible>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
