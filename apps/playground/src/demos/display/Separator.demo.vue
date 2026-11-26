<script lang="ts">
export const meta = {
  name: 'Separator',
  group: 'Display',
  order: 13,
  description: 'Crisp 1px hairline divider — horizontal or vertical, with optional section label.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { DemoSection, DemoCode } from '@/kit';
import { JSeparator, JCard, JButton, JInput, JStack, JInline } from 'jenni-vue';

const html = `<div class="j-stack" data-gap="field" style="width:100%;max-width:420px">
  <hr class="j-separator">
  <div class="j-separator" role="separator"><span class="j-separator__label">OR</span></div>
  <div class="j-inline" data-gap="item" style="height:20px">
    <span>Docs</span>
    <div class="j-separator" role="separator" aria-orientation="vertical"></div>
    <span>Changelog</span>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Horizontal">
    <JStack gap="item" style="width:100%;max-width:420px;font-size:var(--j-text-md)">
      <span>Workspace general</span>
      <JSeparator />
      <span>Billing & invoices</span>
    </JStack>
  </DemoSection>

  <DemoSection title="Vertical">
    <JInline gap="item" style="height:20px;font-size:var(--j-text-md)">
      <a href="#" @click.prevent>Architecture</a>
      <JSeparator orientation="vertical" />
      <a href="#" @click.prevent>Tokens</a>
      <JSeparator orientation="vertical" />
      <a href="#" @click.prevent>Releases</a>
    </JInline>
  </DemoSection>

  <DemoSection title="With label" description="Centered by default, with start and end keyline alignments.">
    <JStack gap="field" style="width:100%;max-width:420px">
      <JSeparator label="OR" />
      <JSeparator label="Today" align="start" />
      <JSeparator label="End of activity" align="end" />
      <JInline gap="field" align="stretch" justify="center" style="height:88px">
        <span style="align-self:center;font-size:var(--j-text-sm);color:var(--j-fg-muted)">Source</span>
        <JSeparator orientation="vertical" label="or" />
        <span style="align-self:center;font-size:var(--j-text-sm);color:var(--j-fg-muted)">Preview</span>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Sign-in card" description="Labelled separator dividing SSO and email authentication.">
    <JCard style="width:100%;max-width:360px" title="Sign in" description="Continue to your workspace.">
      <JStack gap="item">
        <JButton variant="outline" tone="neutral" style="width:100%">Continue with GitHub</JButton>
        <JSeparator label="or continue with email" />
        <JInput type="email" placeholder="you@company.com" />
        <JButton style="width:100%">Continue</JButton>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
