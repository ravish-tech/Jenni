<script lang="ts">
export const meta = {
  name: 'Context Menu',
  group: 'Overlay',
  order: 5,
  description: 'Right-click target surface opening a viewport-clamped .j-menu with keyboard navigation, checkboxes, and radios.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JContextMenu,
  JDropdownItem,
  JDropdownSub,
  JDropdownLabel,
  JDropdownSeparator,
  JBadge,
  JButton,
  JCard,
  JStack,
  JInline,
  JGrid,
  type JContextMenuExpose,
} from 'jenni-vue';

const imperativeMenu = ref<JContextMenuExpose | null>(null);
const anchorBtn = ref<{ $el?: HTMLElement } | HTMLElement | null>(null);
const streamEl = ref<HTMLElement | null>(null);
const streamLines = ref<string[]>([
  '[09:40:01] build worker connected (pid 4182)',
  '[09:40:02] watching 62 component modules…',
]);
let streamTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  streamTimer = setInterval(() => {
    const now = new Date().toISOString().slice(11, 19);
    streamLines.value = [...streamLines.value.slice(-24), `[${now}] tick heartbeat — sibling scroll active`];
    if (streamEl.value) streamEl.value.scrollTop = streamEl.value.scrollHeight;
  }, 700);
});
onBeforeUnmount(() => clearInterval(streamTimer));

function openMenuForButton() {
  const raw = anchorBtn.value;
  const el = raw instanceof HTMLElement ? raw : raw?.$el;
  if (el) imperativeMenu.value?.openFor(el, { keyboard: true });
}

const lastAction = ref('Right-click the canvas card');
const snapToGrid = ref(true);
const showKeylines = ref(false);
const zoomLevel = ref<'50%' | '100%' | '200%'>('100%');
const activeAsset = ref('tokens.css');

const assets = [
  { name: 'tokens.css', meta: 'OKLCH palette & spatial scale · 6.4 KB' },
  { name: 'floating.css', meta: 'CSS anchor positioning layer · 3.8 KB' },
  { name: 'ARCHITECTURE.md', meta: 'Mature elegance specification · 4.1 KB' },
];

const html = `<div
  class="j-card"
  data-variant="outline"
  data-j-context-menu="demo-html-ctx-1"
  tabindex="0"
  style="padding:var(--j-space-6);text-align:center;cursor:context-menu"
>
  <span style="font-size:var(--j-text-sm);color:var(--j-fg-muted)">
    Right-click (or press Shift+F10) anywhere in this region
  </span>
</div>
<div class="j-menu" id="demo-html-ctx-1" popover="auto" role="menu" data-context-menu>
  <div class="j-menu__label">Layer</div>
  <button class="j-menu__item" role="menuitem">Bring to front <kbd class="j-menu__shortcut">]</kbd></button>
  <button class="j-menu__item" role="menuitem">Copy CSS tokens <kbd class="j-menu__shortcut">⌥⌘C</kbd></button>
  <hr class="j-menu__separator" role="separator" />
  <button class="j-menu__item" role="menuitemcheckbox" aria-checked="true">Lock aspect ratio</button>
  <hr class="j-menu__separator" role="separator" />
  <button class="j-menu__item" role="menuitem" data-tone="danger">Delete frame <kbd class="j-menu__shortcut">⌫</kbd></button>
</div>`;
</script>

<template>
  <DemoSection
    title="Design canvas region"
    description="Right-click anywhere inside the stage to position a .j-menu precisely at (clientX, clientY) within an 8px viewport margin."
  >
    <JStack gap="item">
      <JContextMenu>
        <template #trigger>
          <JCard
            variant="outline"
            tabindex="0"
            style="padding:var(--j-space-8);border-style:dashed;cursor:context-menu"
          >
            <JStack gap="related" align="center">
              <span style="font-size:var(--j-text-md);font-weight:var(--j-weight-medium)">
                Artboard 04 — Spatial System
              </span>
              <span style="font-size:var(--j-text-xs);color:var(--j-fg-muted)">
                Right-click anywhere on this surface (or focus and press Shift+F10)
              </span>
            </JStack>
          </JCard>
        </template>

        <JDropdownLabel inset>Artboard</JDropdownLabel>
        <JDropdownItem inset shortcut="⌘D" @select="lastAction = 'Duplicated artboard'">
          Duplicate frame
        </JDropdownItem>
        <JDropdownItem inset shortcut="⇧⌘E" @select="lastAction = 'Exported SVG'">
          Export as SVG
        </JDropdownItem>
        <JDropdownSub inset label="Share">
          <JDropdownItem @select="lastAction = 'Copied permalink'">Copy permalink</JDropdownItem>
          <JDropdownItem @select="lastAction = 'Sent to channel'">Send to channel</JDropdownItem>
          <JDropdownSeparator />
          <JDropdownSub label="Export preset">
            <JDropdownItem @select="lastAction = 'Exported 2x PNG'">2x Retina PNG</JDropdownItem>
            <JDropdownItem @select="lastAction = 'Exported print PDF'">Print-ready PDF</JDropdownItem>
          </JDropdownSub>
        </JDropdownSub>

        <JDropdownSeparator />

        <JDropdownLabel inset>Precision guides</JDropdownLabel>
        <JDropdownItem v-model:checked="snapToGrid" role="menuitemcheckbox" shortcut="⌘'">
          Snap to 4px grid
        </JDropdownItem>
        <JDropdownItem v-model:checked="showKeylines" role="menuitemcheckbox" shortcut="⇧K">
          Optical keylines
        </JDropdownItem>

        <JDropdownSeparator />

        <JDropdownLabel inset>Zoom</JDropdownLabel>
        <div role="group" aria-label="Zoom" class="j-menu__group">
          <JDropdownItem
            v-for="z in (['50%', '100%', '200%'] as const)"
            :key="z"
            role="menuitemradio"
            :checked="zoomLevel === z"
            @select="zoomLevel = z; lastAction = `Zoom ${z}`"
          >
            {{ z }}
          </JDropdownItem>
        </div>

        <JDropdownSeparator />

        <JDropdownItem inset tone="danger" shortcut="⌘⌫" @select="lastAction = 'Cleared guides'">
          Clear all guides
        </JDropdownItem>
      </JContextMenu>

      <JInline gap="related">
        <JBadge variant="soft" tone="neutral">{{ lastAction }}</JBadge>
        <JBadge v-if="snapToGrid" size="sm" variant="outline" tone="neutral">4px Snap</JBadge>
        <JBadge v-if="showKeylines" size="sm" variant="outline" tone="neutral">Keylines</JBadge>
        <JBadge size="sm" tone="info">{{ zoomLevel }}</JBadge>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Contextual file cards"
    description="Each item owns an independent right-click menu; opening a second closes the first seamlessly."
  >
    <JGrid :cols="3" gap="item">
      <JContextMenu v-for="file in assets" :key="file.name">
        <template #trigger>
          <JCard
            size="sm"
            interactive
            :title="file.name"
            :description="file.meta"
            style="cursor:context-menu"
          />
        </template>

        <JDropdownLabel>{{ file.name }}</JDropdownLabel>
        <JDropdownItem shortcut="⏎" @select="activeAsset = `Opened ${file.name}`">Open specification</JDropdownItem>
        <JDropdownItem shortcut="⌥⌘C" @select="activeAsset = `Copied path: ${file.name}`">Copy relative path</JDropdownItem>
        <JDropdownSub label="Share">
          <JDropdownItem @select="activeAsset = `Copied permalink: ${file.name}`">Copy permalink</JDropdownItem>
          <JDropdownItem @select="activeAsset = `Sent ${file.name} to channel`">Send to channel</JDropdownItem>
        </JDropdownSub>
        <JDropdownSeparator />
        <JDropdownItem tone="danger" @select="activeAsset = `Archived ${file.name}`">Move to archive</JDropdownItem>
      </JContextMenu>
    </JGrid>
    <div style="margin-top:var(--j-space-3)">
      <JBadge variant="soft" tone="neutral">Status: {{ activeAsset }}</JBadge>
    </div>
  </DemoSection>

  <DemoSection
    title="Imperative / Keyboard Open & Streaming Log Isolation (R01 + R02)"
    description="Open a headless JContextMenu from code via openAt(x, y) or openFor(el, { keyboard: true }) — notice the auto-scrolling log pane beside it never closes an open context menu!"
  >
    <JInline gap="group" wrap style="width: 100%; align-items: stretch">
      <JStack gap="related" style="flex: 1; min-width: 240px">
        <JInline gap="related" wrap>
          <JButton ref="anchorBtn" variant="outline" @click="openMenuForButton">
            Open via openFor(button)
          </JButton>
          <JButton variant="ghost" @click="imperativeMenu?.openAt(260, 240, { keyboard: true })">
            openAt(260, 240)
          </JButton>
        </JInline>
        <span style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">
          Press Escape inside the menu to restore focus cleanly back to the button.
        </span>
      </JStack>

      <div
        ref="streamEl"
        style="
          flex: 1;
          min-width: 260px;
          height: 96px;
          overflow-y: auto;
          padding: var(--j-space-2) var(--j-space-3);
          border-radius: var(--j-radius-sm);
          background: var(--j-surface-2);
          box-shadow: inset 0 0 0 1px var(--j-border);
          font-family: var(--j-font-mono);
          font-size: 11px;
          color: var(--j-fg-muted);
        "
      >
        <div v-for="(ln, idx) in streamLines" :key="idx">{{ ln }}</div>
      </div>

      <JContextMenu ref="imperativeMenu">
        <JDropdownLabel>Imperative Tab Menu</JDropdownLabel>
        <JDropdownItem shortcut="⌘W" @select="lastAction = 'Closed active tab'">Close tab</JDropdownItem>
        <JDropdownItem @select="lastAction = 'Split pane right'">Split right</JDropdownItem>
        <JDropdownSeparator />
        <JDropdownItem tone="danger" @select="lastAction = 'Killed terminal session'">Kill process</JDropdownItem>
      </JContextMenu>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="[data-j-context-menu] + .j-menu[data-context-menu] + initContextMenus().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
