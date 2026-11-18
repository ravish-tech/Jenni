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
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JContextMenu,
  JDropdownItem,
  JDropdownLabel,
  JDropdownSeparator,
  JBadge,
  JCard,
  JStack,
  JInline,
  JGrid,
} from 'jenni-vue';

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
        <JDropdownSeparator />
        <JDropdownItem tone="danger" @select="activeAsset = `Archived ${file.name}`">Move to archive</JDropdownItem>
      </JContextMenu>
    </JGrid>
    <div style="margin-top:var(--j-space-3)">
      <JBadge variant="soft" tone="neutral">Status: {{ activeAsset }}</JBadge>
    </div>
  </DemoSection>

  <DemoSection title="Plain HTML" description="[data-j-context-menu] + .j-menu[data-context-menu] + initContextMenus().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
