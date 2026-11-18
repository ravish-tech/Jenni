<script lang="ts">
export const meta = {
  name: 'Popover',
  group: 'Overlay',
  order: 3,
  description: 'Floating surface anchored to a trigger for contextual forms, inspectors and quick settings.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JPopover, JButton, JInput, JField, JSwitch, JBadge, JStack, JInline, JGrid } from '@jenni/vue';

const publicLink = ref(true);
const linkCopied = ref(false);
const filterOpen = ref(false);
const shareUrl = 'https://acme.dev/s/q4-architecture';

function copyShare() {
  linkCopied.value = true;
  setTimeout(() => (linkCopied.value = false), 1400);
}

const html = `<button class="j-button" data-variant="outline" popovertarget="demo-html-pop-1">
  Workspace info
</button>
<div class="j-popover" id="demo-html-pop-1" popover data-side="bottom" data-align="start" data-arrow>
  <h3 class="j-popover__title">meridian-design</h3>
  <p class="j-popover__description">Production workspace · EU Central (Frankfurt)</p>
  <div class="j-popover__footer">
    <button class="j-button" data-size="sm" data-variant="ghost" popovertarget="demo-html-pop-1" popovertargetaction="hide">Close</button>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Share popover" description="Anchored inspector with read-only link field, access toggle and tinted footer.">
    <JPopover align="start" size="lg" arrow>
      <template #trigger>
        <JButton>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 3.5h2v2M6.5 9.5l6-6M12.5 9v3a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3" /></svg>
          Share specification
        </JButton>
      </template>
      <template #default="{ close }">
        <JStack gap="field">
          <div>
            <JInline justify="between" gap="related">
              <h3 class="j-popover__title">Share “Q4 Architecture”</h3>
              <JBadge :tone="publicLink ? 'success' : 'neutral'" size="sm">
                {{ publicLink ? 'Public' : 'Restricted' }}
              </JBadge>
            </JInline>
            <p class="j-popover__description">Anyone with the link can inspect tokens and layout rules.</p>
          </div>

          <JInline gap="related" nowrap>
            <JInput :model-value="shareUrl" readonly size="sm" style="flex:1" />
            <JButton size="sm" variant="soft" @click="copyShare">
              {{ linkCopied ? 'Copied' : 'Copy' }}
            </JButton>
          </JInline>

          <JSwitch
            v-model="publicLink"
            size="sm"
            placement="end"
            label="Public link access"
            description="Allow read-only viewing without sign-in."
          />
        </JStack>

        <div class="j-popover__footer">
          <JButton size="sm" variant="ghost" @click="close">Done</JButton>
        </div>
      </template>
    </JPopover>
  </DemoSection>

  <DemoSection title="Sizes & placement" description="sm (14rem) · md (18rem) · lg (24rem), placed on any side with micro-settle entrance.">
    <JInline gap="item" justify="center">
      <JPopover size="sm" side="top" arrow>
        <template #trigger><JButton variant="outline" size="sm">Small · Top</JButton></template>
        <h3 class="j-popover__title">Compact</h3>
        <p class="j-popover__description">Brief status summary or inline helper.</p>
      </JPopover>

      <JPopover size="md" side="bottom" arrow>
        <template #trigger><JButton variant="outline">Medium · Bottom</JButton></template>
        <h3 class="j-popover__title">Default measure</h3>
        <p class="j-popover__description">Balanced for 1–3 form controls or metadata rows.</p>
      </JPopover>

      <JPopover size="lg" side="right" arrow>
        <template #trigger><JButton variant="outline">Large · Right</JButton></template>
        <h3 class="j-popover__title">Wide inspector</h3>
        <p class="j-popover__description">Sized for multi-column pickers and share panels.</p>
      </JPopover>
    </JInline>
  </DemoSection>

  <DemoSection title="Controlled state" description="v-model:open syncs cleanly with Escape and outside-click light dismiss.">
    <JInline gap="item" justify="center">
      <JPopover v-model:open="filterOpen" align="end">
        <template #trigger>
          <JButton variant="soft" tone="neutral">Export bounds</JButton>
        </template>
        <template #default="{ close }">
          <JStack gap="item">
            <div>
              <h3 class="j-popover__title">Frame dimensions</h3>
              <p class="j-popover__description">Configure default viewport export size.</p>
            </div>
            <JGrid :cols="2" gap="related">
              <JField label="Width">
                <JInput model-value="1440px" size="sm" />
              </JField>
              <JField label="Height">
                <JInput model-value="900px" size="sm" />
              </JField>
            </JGrid>
          </JStack>
          <div class="j-popover__footer">
            <JButton size="sm" variant="ghost" @click="close">Cancel</JButton>
            <JButton size="sm" @click="close">Apply</JButton>
          </div>
        </template>
      </JPopover>
      <span style="font-size:var(--j-text-sm);color:var(--j-fg-muted)">
        State: <code>{{ filterOpen ? 'open' : 'closed' }}</code>
      </span>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Zero-framework native popovertarget + initPopovers().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
