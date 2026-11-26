<script lang="ts">
export const meta = {
  name: 'Dropdown Menu',
  group: 'Overlay',
  order: 4,
  description: 'Compact 32px action menu with roving keyboard navigation, typeahead, shortcuts, checkboxes and radios.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JDropdownMenu,
  JDropdownItem,
  JDropdownSub,
  JDropdownLabel,
  JDropdownSeparator,
  JButton,
  JBadge,
  JAvatar,
  JInline,
} from 'jenni-vue';

const lastAction = ref('None selected');
const showGrid = ref(true);
const showRulers = ref(false);
const snapPixels = ref(true);
const density = ref<'compact' | 'default' | 'comfortable'>('default');

const html = `<button class="j-button" data-variant="outline" popovertarget="demo-html-menu-1">
  Quick actions
</button>
<div class="j-menu" id="demo-html-menu-1" popover role="menu" data-align="start">
  <div class="j-menu__label">Document</div>
  <button class="j-menu__item" role="menuitem">Duplicate <kbd class="j-menu__shortcut">⌘D</kbd></button>
  <button class="j-menu__item" role="menuitem">Rename <kbd class="j-menu__shortcut">⏎</kbd></button>
  <hr class="j-menu__separator" role="separator" />
  <button class="j-menu__item" role="menuitemcheckbox" aria-checked="true">Lock layer</button>
  <hr class="j-menu__separator" role="separator" />
  <button class="j-menu__item" role="menuitem" data-tone="danger">Move to trash <kbd class="j-menu__shortcut">⌘⌫</kbd></button>
</div>`;
</script>

<template>
  <DemoSection title="Account menu" description="Aligned to --j-list-h-compact (32px) with icons, shortcuts, grouped sections and destructive tone.">
    <JInline gap="item" justify="center">
      <JDropdownMenu align="start">
        <template #trigger>
          <JButton variant="outline">
            <JAvatar name="Ada Lovelace" size="xs" />
            Ada Lovelace
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" /></svg>
          </JButton>
        </template>

        <JDropdownLabel>ada@acme.dev</JDropdownLabel>
        <JDropdownItem shortcut="⇧⌘P" @select="lastAction = 'Profile'">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="5.5" r="2.5" /><path d="M3.5 13c.6-2.2 2.4-3.5 4.5-3.5s3.9 1.3 4.5 3.5" /></svg>
          </template>
          Profile
        </JDropdownItem>
        <JDropdownItem shortcut="⌘B" @select="lastAction = 'Billing'">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="M2 6.5h12" /></svg>
          </template>
          Billing & plans
        </JDropdownItem>
        <JDropdownItem shortcut="⌘," @select="lastAction = 'Preferences'">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="2.2" /><path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M12.2 3.8l-1 1M4.8 11.2l-1 1" /></svg>
          </template>
          Preferences
        </JDropdownItem>
        <JDropdownItem disabled shortcut="⌘T">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M8 3v10M3 8h10" /></svg>
          </template>
          Invite member (Admin)
        </JDropdownItem>

        <JDropdownSeparator />

        <JDropdownItem tone="danger" shortcut="⇧⌘Q" @select="lastAction = 'Signed out'">
          <template #icon>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 11l3-3-3-3M13.5 8H6.5" /></svg>
          </template>
          Sign out
        </JDropdownItem>
      </JDropdownMenu>

      <JBadge variant="soft" tone="neutral">Last action: {{ lastAction }}</JBadge>
    </JInline>
  </DemoSection>

  <DemoSection title="Checkboxes & radios" description="Checkable items toggle calmly in place without closing the menu; inset aligns plain labels and actions.">
    <JInline gap="item" justify="center">
      <JDropdownMenu align="start" arrow>
        <template #trigger>
          <JButton variant="soft">View options</JButton>
        </template>

        <JDropdownLabel inset>Canvas guides</JDropdownLabel>
        <JDropdownItem v-model:checked="showGrid" role="menuitemcheckbox" shortcut="⌘'">
          Baseline grid
        </JDropdownItem>
        <JDropdownItem v-model:checked="showRulers" role="menuitemcheckbox" shortcut="⇧R">
          Keyline rulers
        </JDropdownItem>
        <JDropdownItem v-model:checked="snapPixels" role="menuitemcheckbox">
          Snap to 4px grid
        </JDropdownItem>

        <JDropdownSeparator />

        <JDropdownLabel inset>Density</JDropdownLabel>
        <div role="group" aria-label="Density" class="j-menu__group">
          <JDropdownItem
            v-for="d in (['compact', 'default', 'comfortable'] as const)"
            :key="d"
            role="menuitemradio"
            :checked="density === d"
            @select="density = d"
          >
            {{ d[0]!.toUpperCase() + d.slice(1) }}
          </JDropdownItem>
        </div>

        <JDropdownSeparator />

        <JDropdownItem inset @select="showGrid = true; showRulers = false; snapPixels = true; density = 'default'">
          Reset view
        </JDropdownItem>
      </JDropdownMenu>

      <JInline gap="inline">
        <JBadge v-if="showGrid" size="sm" variant="outline" tone="neutral">Grid</JBadge>
        <JBadge v-if="showRulers" size="sm" variant="outline" tone="neutral">Rulers</JBadge>
        <JBadge v-if="snapPixels" size="sm" variant="outline" tone="neutral">Snap</JBadge>
        <JBadge size="sm" tone="info">{{ density }}</JBadge>
      </JInline>
    </JInline>
  </DemoSection>

  <DemoSection title="Cascading Submenus" description="Nested WAI-ARIA submenus with diagonal hover grace timers and ArrowRight / ArrowLeft keyboard navigation.">
    <JInline gap="item" justify="center">
      <JDropdownMenu align="start">
        <template #trigger>
          <JButton variant="outline">
            File actions
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 6.5 3.5 3.5 3.5-3.5" /></svg>
          </JButton>
        </template>

        <JDropdownItem shortcut="⌘N" @select="lastAction = 'New document'">New document</JDropdownItem>
        <JDropdownSub label="Share">
          <JDropdownItem @select="lastAction = 'Copy link'">Copy public link</JDropdownItem>
          <JDropdownItem @select="lastAction = 'Invite email'">Invite by email…</JDropdownItem>
          <JDropdownSeparator />
          <JDropdownSub label="Embed snippet">
            <JDropdownItem @select="lastAction = 'Embed iframe'">Responsive iframe</JDropdownItem>
            <JDropdownItem @select="lastAction = 'Embed script'">Async script tag</JDropdownItem>
            <JDropdownItem @select="lastAction = 'Embed markdown'">Markdown card</JDropdownItem>
          </JDropdownSub>
        </JDropdownSub>
        <JDropdownSub label="Export as">
          <JDropdownItem shortcut="⇧⌘E" @select="lastAction = 'Export PNG'">PNG (2x retina)</JDropdownItem>
          <JDropdownItem @select="lastAction = 'Export SVG'">Vector SVG</JDropdownItem>
          <JDropdownItem @select="lastAction = 'Export PDF'">Print-ready PDF</JDropdownItem>
        </JDropdownSub>
        <JDropdownSub label="Archive (locked)" disabled>
          <JDropdownItem>Cold storage</JDropdownItem>
        </JDropdownSub>
        <JDropdownSeparator />
        <JDropdownItem tone="danger" shortcut="⌘⌫" @select="lastAction = 'Move to trash'">Move to trash</JDropdownItem>
      </JDropdownMenu>

      <JBadge variant="soft" tone="neutral">Selected: {{ lastAction }}</JBadge>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Native popover + role='menu' + initMenus().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
