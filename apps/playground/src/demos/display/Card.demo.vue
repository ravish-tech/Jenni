<script lang="ts">
export const meta = {
  name: 'Card',
  group: 'Display',
  order: 3,
  description: 'Architectural surface that groups related content and actions.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import {
  JCard,
  JBadge,
  JAvatar,
  JSeparator,
  JButton,
  JGrid,
  JStack,
  JInline,
  JList,
  JListItem,
} from 'jenni-vue';

const variants = ['surface', 'outline', 'ghost', 'elevated'] as const;
const plans = [
  { name: 'Starter', price: '$0', desc: 'For personal workspaces.', features: ['3 active projects', 'Community support', '2 GB artifact storage'], featured: false },
  { name: 'Team', price: '$24', desc: 'For product engineering teams.', features: ['Unlimited projects', 'Priority SLA support', '100 GB storage', 'Audit trail'], featured: true },
  { name: 'Enterprise', price: 'Custom', desc: 'For regulated organizations.', features: ['SAML SSO & SCIM', 'Dedicated region', '99.99% uptime SLA'], featured: false },
] as const;

const html = `<article class="j-card" style="width:100%;max-width:360px">
  <header class="j-card__header">
    <h3 class="j-card__title">Build capacity</h3>
    <p class="j-card__description">72% of monthly build minutes used.</p>
  </header>
  <div class="j-card__body">
    <progress class="j-progress" value="72" max="100"></progress>
  </div>
  <footer class="j-card__footer" data-divider>
    <span class="j-badge" data-tone="warning">Resets in 9 days</span>
  </footer>
</article>`;
</script>

<template>
  <DemoSection title="Variants" description="surface (default) · outline · ghost · elevated">
    <JGrid :min-cell-width="210" gap="field" style="width:100%">
      <JCard v-for="v in variants" :key="v" :variant="v" :title="v[0]!.toUpperCase() + v.slice(1)" description="Groups related content.">
        Crisp 1px hairline border and quiet ambient depth.
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection title="Interactive" description="Rendered as a link or button, cards settle calmly via border and shadow refinement — never lifting or squishing.">
    <JGrid :min-cell-width="210" gap="field" style="width:100%">
      <JCard v-for="v in variants" :key="v" as="a" href="#" :variant="v" :title="`${v[0]!.toUpperCase() + v.slice(1)} link`" description="Poised hover and focus ring." @click.prevent />
      <JCard as="button" type="button" title="Action card" description="Native <button> with keyboard support." />
    </JGrid>
  </DemoSection>

  <DemoSection title="Sizes" description="sm · md (default) · lg">
    <JGrid :min-cell-width="210" gap="field" style="width:100%">
      <JCard size="sm" title="Small" description="Inspectors and compact sidebars." />
      <JCard title="Medium" description="Balanced workspace container." />
      <JCard size="lg" title="Large" description="Spacious editorial callouts." />
    </JGrid>
  </DemoSection>

  <DemoSection title="Header action & footer divider" description="Structured list rows inside a card with a tinted footer bar.">
    <JCard title="Workspace members" description="Manage seats and repository access." footer-divider style="width:100%;max-width:440px">
      <template #action>
        <JBadge variant="outline" tone="neutral">3 / 5 seats</JBadge>
      </template>
      <JList variant="divided" inset-divider lines="1" style="margin-inline:calc(var(--j-space-3) * -1)">
        <JListItem v-for="n in ['Ada Lovelace', 'Grace Hopper', 'Alan Turing']" :key="n" :title="n">
          <template #leading>
            <JAvatar :name="n" size="sm" />
          </template>
          <template #trailing>
            <span>{{ n === 'Ada Lovelace' ? 'Owner' : 'Member' }}</span>
          </template>
        </JListItem>
      </JList>
      <template #footer>
        <span style="color:var(--j-fg-muted);font-size:var(--j-text-sm)">Billing cycle renews on the 1st of each month.</span>
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Pricing tiers" description="Multi-column editorial comparison with aligned footers.">
    <JGrid :min-cell-width="220" gap="field" style="width:100%;max-width:820px">
      <JCard v-for="plan in plans" :key="plan.name" :variant="plan.featured ? 'elevated' : 'surface'">
        <template #header>
          <div class="j-card__header">
            <h3 class="j-card__title">{{ plan.name }}</h3>
            <span class="j-card__description">{{ plan.desc }}</span>
            <JBadge v-if="plan.featured" variant="soft" size="sm">Recommended</JBadge>
          </div>
        </template>
        <JStack gap="item">
          <JInline gap="inline" align="baseline">
            <span style="font-size:var(--j-text-3xl);font-weight:var(--j-weight-semibold);letter-spacing:var(--j-tracking-tight)">{{ plan.price }}</span>
            <span v-if="plan.price.startsWith('$')" style="color:var(--j-fg-muted);font-size:var(--j-text-sm)">/ member</span>
          </JInline>
          <JSeparator decorative />
          <JStack as="ul" gap="related" style="list-style:none;padding:0;margin:0;font-size:var(--j-text-sm)">
            <JInline v-for="f in plan.features" :key="f" as="li" gap="related" nowrap>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:var(--j-success);flex:none"><path d="m3.5 8.5 3 3 6-7" /></svg>
              <span>{{ f }}</span>
            </JInline>
          </JStack>
        </JStack>
        <template #footer>
          <JButton :variant="plan.featured ? 'solid' : 'outline'" style="width:100%">
            {{ plan.price === 'Custom' ? 'Contact sales' : 'Select plan' }}
          </JButton>
        </template>
      </JCard>
    </JGrid>
  </DemoSection>

  <DemoSection title="Media" description="j-card__media bleeds cleanly to the card perimeter.">
    <JCard as="a" href="#" style="width:100%;max-width:320px" title="Nordic Architecture Notes" description="Oslo, Norway · 6 min read" @click.prevent>
      <template #media>
        <div style="aspect-ratio:16/9;background:linear-gradient(135deg, var(--j-accent-soft), var(--j-info-soft), var(--j-surface-3))" />
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
