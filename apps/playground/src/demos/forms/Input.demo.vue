<script lang="ts">
export const meta = {
  name: 'Input',
  group: 'Forms',
  order: 5,
  description: 'Single-line text entry with optional prefix / suffix adornments.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JButton, JInline, JInput, JKbd, JStack } from 'jenni-vue';

const query = ref('');
const filterText = ref('status:open assignee:ada');
const clearCount = ref(0);
const domain = ref('meridian');
const protocol = 'https://';
const copied = ref(false);
function copy() {
  copied.value = true;
  setTimeout(() => (copied.value = false), 1200);
}

const html = `<div class="j-stack" data-gap="item" style="width:100%;max-width:360px">
  <input class="j-input" placeholder="Your name">
  <div class="j-input-group">
    <span class="j-input-group__addon">https://</span>
    <input class="j-input" placeholder="your-site">
    <span class="j-input-group__addon">.acme.dev</span>
  </div>
  <input class="j-input" aria-invalid="true" value="not-an-email">
</div>`;
</script>

<template>
  <DemoSection title="Basic">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JInput v-model="query" placeholder="Type something…" />
      <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Value: “{{ query }}”</span>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes" description="sm · md · lg — heights match Button.">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JInput size="sm" placeholder="Small" />
      <JInput placeholder="Medium" />
      <JInput size="lg" placeholder="Large" />
    </JStack>
  </DemoSection>

  <DemoSection title="Adornments" description="Prefix / suffix slots wrap the input in .j-input-group. Click an addon to focus.">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JInput v-model="query" placeholder="Search issues">
        <template #prefix>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
        </template>
        <template #suffix><JKbd size="sm">⌘K</JKbd></template>
      </JInput>
      <JInput v-model="domain">
        <template #prefix>{{ protocol }}</template>
        <template #suffix>.acme.dev</template>
      </JInput>
      <JInput model-value="sk_live_51H…9f2a" readonly>
        <template #suffix>
          <JButton variant="ghost" @click="copy">{{ copied ? 'Copied' : 'Copy' }}</JButton>
        </template>
      </JInput>
      <JInput size="sm" placeholder="Amount" type="number">
        <template #prefix>$</template>
        <template #suffix>USD</template>
      </JInput>
    </JStack>
  </DemoSection>

  <DemoSection title="Clearable inputs" description="Renders inside .j-input-group with zero layout shift; clicking clear resets the value and restores focus.">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JInput v-model="filterText" clearable placeholder="Filter issues…" @clear="clearCount++" />
      <JInput v-model="query" clearable placeholder="Search symbols…">
        <template #prefix>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3 3" /></svg>
        </template>
        <template #suffix><JKbd size="sm">⌘K</JKbd></template>
      </JInput>
      <span style="color: var(--j-fg-muted); font-size: var(--j-text-sm)">Cleared {{ clearCount }} time(s)</span>
    </JStack>
  </DemoSection>

  <DemoSection title="Tones" description="Tone sets the focus border and composed 3px optical halo.">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JInput tone="success" placeholder="Focus me (success)" />
      <JInput tone="neutral" placeholder="Focus me (neutral)" />
    </JStack>
  </DemoSection>

  <DemoSection title="States" description="Hover, focus, invalid, read-only, disabled.">
    <JStack gap="item" style="width: 100%; max-width: 360px">
      <JInput placeholder="Hover / focus me" />
      <JInput invalid model-value="not-an-email" />
      <JInput invalid model-value="@ravish">
        <template #prefix>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13.5c.8-2.4 2.7-3.5 5-3.5s4.2 1.1 5 3.5" /></svg>
        </template>
      </JInput>
      <JInput readonly model-value="Read-only value" />
      <JInput disabled placeholder="Disabled" />
      <JInput disabled model-value="Disabled with addon">
        <template #prefix>@</template>
      </JInput>
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="Inline subscribe form.">
    <JInline as="form" gap="related" nowrap style="width: 100%; max-width: 420px" @submit.prevent>
      <JInput type="email" placeholder="you@company.com" style="flex: 1">
        <template #prefix>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="m2.5 4.5 5.5 4 5.5-4" /></svg>
        </template>
      </JInput>
      <JButton type="submit">Subscribe</JButton>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
