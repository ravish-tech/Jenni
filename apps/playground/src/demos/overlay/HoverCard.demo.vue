<script lang="ts">
export const meta = {
  name: 'Hover Card',
  group: 'Overlay',
  order: 2,
  description: 'Interactive preview card opened after a calm 320ms hover delay and bridged across a 180ms close delay.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JHoverCard,
  JButton,
  JAvatar,
  JBadge,
  JCard,
  JStack,
  JInline,
} from '@jenni/vue';

const followingAda = ref(false);
const followingDieter = ref(true);

const html = `<span style="font-size:var(--j-text-sm);color:var(--j-fg-muted)">
  Maintained by
  <a
    href="#pkg-core"
    data-j-hover-card="demo-html-hc-1"
    style="color:var(--j-fg);font-weight:var(--j-weight-medium);text-decoration:underline;text-underline-offset:3px"
  >@jenni/core</a>
  in the monorepo.
</span>
<div class="j-hover-card" id="demo-html-hc-1" popover="manual" data-side="top" data-align="start" data-arrow>
  <div class="j-stack" data-gap="related">
    <div class="j-inline" data-gap="related" data-justify="between">
      <strong style="font-size:var(--j-text-sm)">@jenni/core</strong>
      <span class="j-badge" data-size="sm" data-variant="soft">v0.0.1</span>
    </div>
    <p style="margin:0;font-size:var(--j-text-xs);color:var(--j-fg-muted)">
      Zero-dependency OKLCH design tokens, CSS anchor positioning layers, and idempotent vanilla JS behaviors.
    </p>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Inline mention previews"
    description="Hover or keyboard-focus a handle — move your pointer across the gap onto the card to interact with controls."
  >
    <JCard variant="outline" style="max-width:34rem">
      <p style="margin:0;font-size:var(--j-text-md);line-height:1.65;color:var(--j-fg-muted)">
        Architectural review for the spatial overlay specification was completed by
        <JHoverCard align="start" arrow>
          <template #trigger>
            <a
              href="#ada"
              style="color:var(--j-fg);font-weight:var(--j-weight-medium);text-decoration:underline;text-underline-offset:3px"
              @click.prevent
            >@ada</a>
          </template>
          <JStack gap="item">
            <JInline justify="between" align="start" gap="item">
              <JInline gap="item">
                <JAvatar name="Ada Lovelace" size="md" />
                <div>
                  <div style="font-weight:var(--j-weight-semibold);font-size:var(--j-text-sm)">Ada Lovelace</div>
                  <div style="color:var(--j-fg-muted);font-size:var(--j-text-xs)">@ada · London</div>
                </div>
              </JInline>
              <JButton
                size="sm"
                :variant="followingAda ? 'outline' : 'solid'"
                @click="followingAda = !followingAda"
              >
                {{ followingAda ? 'Following' : 'Follow' }}
              </JButton>
            </JInline>
            <p style="margin:0;font-size:var(--j-text-xs);color:var(--j-fg-muted)">
              Principal Systems Architect working on top-layer primitives, declarative invokers, and deterministic layout engines.
            </p>
            <JInline gap="item">
              <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)"><strong style="color:var(--j-fg)">148</strong> specs</span>
              <span style="font-size:var(--j-text-xs);color:var(--j-fg-subtle)"><strong style="color:var(--j-fg)">2.4k</strong> followers</span>
            </JInline>
          </JStack>
        </JHoverCard>
        and signed off by
        <JHoverCard align="start" arrow>
          <template #trigger>
            <a
              href="#dieter"
              style="color:var(--j-fg);font-weight:var(--j-weight-medium);text-decoration:underline;text-underline-offset:3px"
              @click.prevent
            >@dieter</a>
          </template>
          <JStack gap="item">
            <JInline justify="between" align="start" gap="item">
              <JInline gap="item">
                <JAvatar name="Dieter Rams" size="md" />
                <div>
                  <div style="font-weight:var(--j-weight-semibold);font-size:var(--j-text-sm)">Dieter Rams</div>
                  <div style="color:var(--j-fg-muted);font-size:var(--j-text-xs)">@dieter · Kronberg</div>
                </div>
              </JInline>
              <JButton
                size="sm"
                :variant="followingDieter ? 'outline' : 'solid'"
                @click="followingDieter = !followingDieter"
              >
                {{ followingDieter ? 'Following' : 'Follow' }}
              </JButton>
            </JInline>
            <p style="margin:0;font-size:var(--j-text-xs);color:var(--j-fg-muted)">
              Less, but better. Guardian of Mature Elegance: zero overshoot, honest surfaces, and quiet spatial precision.
            </p>
            <JInline gap="related">
              <JBadge size="sm" variant="soft" tone="success">Design Lead</JBadge>
              <JBadge size="sm" variant="outline" tone="neutral">10 Principles</JBadge>
            </JInline>
          </JStack>
        </JHoverCard>
        ahead of release cutover.
      </p>
    </JCard>
  </DemoSection>

  <DemoSection
    title="Sides & sizes"
    description="sm (16rem) · md (20rem, default) · lg (24rem), placed on any side with 2px whisper-subtle settle over 220ms."
  >
    <JInline gap="item" justify="center">
      <JHoverCard side="top" size="sm" arrow>
        <template #trigger>
          <JButton variant="outline" size="sm">Top · Small</JButton>
        </template>
        <JStack gap="inline">
          <strong style="font-size:var(--j-text-sm)">Commit 8f3a19c</strong>
          <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">Verified signature · 12m ago</span>
        </JStack>
      </JHoverCard>

      <JHoverCard side="bottom" size="md" arrow>
        <template #trigger>
          <JButton variant="outline">Bottom · Medium</JButton>
        </template>
        <JStack gap="related">
          <JInline justify="between" gap="related">
            <strong style="font-size:var(--j-text-sm)">Issue LIN-412</strong>
            <JBadge size="sm" tone="info">In Review</JBadge>
          </JInline>
          <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">
            Standardize overlay elevation tokens and @starting-style transitions across Chromium, Safari, and Firefox.
          </span>
        </JStack>
      </JHoverCard>

      <JHoverCard side="right" size="lg" arrow>
        <template #trigger>
          <JButton variant="outline">Right · Large</JButton>
        </template>
        <JStack gap="related">
          <JInline justify="between" gap="related">
            <strong style="font-size:var(--j-text-sm)">EU-Central Frankfurt</strong>
            <JBadge size="sm" tone="success">99.99% SLA</JBadge>
          </JInline>
          <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">
            12 active edge nodes · p99 latency 11.4ms · TLS 1.3 strict transport enabled.
          </span>
        </JStack>
      </JHoverCard>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="[data-j-hover-card] + popover='manual' + initHoverCards().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
