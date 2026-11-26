<script lang="ts">
export const meta = {
  name: 'Menubar',
  group: 'Overlay',
  order: 5.5,
  wide: true,
  description: 'WAI-ARIA role="menubar" horizontal menu bar with roving tabindex, instant desktop hover handoff, cross-menu arrow switching and cascading submenus.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JMenubar,
  JMenubarMenu,
  JDropdownItem,
  JDropdownLabel,
  JDropdownSeparator,
  JDropdownSub,
  JToolbar,
  JToolbarSpacer,
  JBadge,
  JInline,
  JStack,
} from 'jenni-vue';

const lastCommand = ref('Ready');
const wordWrap = ref(true);
const showMinimap = ref(true);
const showBreadcrumbs = ref(true);
const autoSave = ref(true);
const panelDock = ref<'bottom' | 'right' | 'left'>('bottom');

const html = `<div class="j-menubar" role="menubar" aria-label="Application menu">
  <div class="j-menubar__menu" role="none">
    <button type="button" class="j-menubar__trigger" role="menuitem" aria-haspopup="menu" aria-expanded="false" aria-controls="demo-mb-file">
      File
    </button>
    <div class="j-menu j-menubar__content" id="demo-mb-file" role="menu" popover="manual" data-side="bottom" data-align="start">
      <button class="j-menu__item" role="menuitem">New file <kbd class="j-menu__shortcut">⌘N</kbd></button>
      <button class="j-menu__item" role="menuitem">Save <kbd class="j-menu__shortcut">⌘S</kbd></button>
      <hr class="j-menu__separator" role="separator" />
      <button class="j-menu__item" role="menuitem">Close editor <kbd class="j-menu__shortcut">⌘W</kbd></button>
    </div>
  </div>
  <div class="j-menubar__menu" role="none">
    <button type="button" class="j-menubar__trigger" role="menuitem" aria-haspopup="menu" aria-expanded="false" aria-controls="demo-mb-edit">
      Edit
    </button>
    <div class="j-menu j-menubar__content" id="demo-mb-edit" role="menu" popover="manual" data-side="bottom" data-align="start">
      <button class="j-menu__item" role="menuitem">Undo <kbd class="j-menu__shortcut">⌘Z</kbd></button>
      <button class="j-menu__item" role="menuitem">Redo <kbd class="j-menu__shortcut">⇧⌘Z</kbd></button>
    </div>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Workbench application bar"
    description="Open any menu and glide across File · Edit · Selection · View · Terminal · Help with the pointer or switch menus via ArrowRight and ArrowLeft."
  >
    <JStack gap="item">
      <JInline gap="item" align="center" justify="between" wrap>
        <JMenubar aria-label="Workbench menu">
          <JMenubarMenu label="File">
            <JDropdownItem shortcut="⌘N" @select="lastCommand = 'File → New file'">New file</JDropdownItem>
            <JDropdownItem shortcut="⇧⌘N" @select="lastCommand = 'File → New window'">New window</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownItem shortcut="⌘O" @select="lastCommand = 'File → Open workspace'">Open workspace…</JDropdownItem>
            <JDropdownSub label="Open recent">
              <JDropdownItem @select="lastCommand = 'Open ~/monorepo/core'">~/monorepo/core</JDropdownItem>
              <JDropdownItem @select="lastCommand = 'Open ~/services/edge-router'">~/services/edge-router</JDropdownItem>
              <JDropdownItem @select="lastCommand = 'Open ~/infra/terraform'">~/infra/terraform</JDropdownItem>
              <JDropdownSeparator />
              <JDropdownItem @select="lastCommand = 'Cleared recent workspaces'">Clear recent</JDropdownItem>
            </JDropdownSub>
            <JDropdownSeparator />
            <JDropdownItem shortcut="⌘S" @select="lastCommand = 'File → Save'">Save</JDropdownItem>
            <JDropdownItem shortcut="⌥⌘S" @select="lastCommand = 'File → Save all'">Save all</JDropdownItem>
            <JDropdownItem v-model:checked="autoSave" role="menuitemcheckbox">Auto save</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownSub label="Export bundle">
              <JDropdownItem @select="lastCommand = 'Export → Static HTML'">Static HTML archive</JDropdownItem>
              <JDropdownItem @select="lastCommand = 'Export → PDF report'">Signed PDF report</JDropdownItem>
            </JDropdownSub>
            <JDropdownSeparator />
            <JDropdownItem tone="danger" shortcut="⌘W" @select="lastCommand = 'File → Close workspace'">
              Close workspace
            </JDropdownItem>
          </JMenubarMenu>

          <JMenubarMenu label="Edit">
            <JDropdownItem shortcut="⌘Z" @select="lastCommand = 'Edit → Undo'">Undo</JDropdownItem>
            <JDropdownItem shortcut="⇧⌘Z" @select="lastCommand = 'Edit → Redo'">Redo</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownItem shortcut="⌘X" @select="lastCommand = 'Edit → Cut'">Cut</JDropdownItem>
            <JDropdownItem shortcut="⌘C" @select="lastCommand = 'Edit → Copy'">Copy</JDropdownItem>
            <JDropdownItem shortcut="⌘V" @select="lastCommand = 'Edit → Paste'">Paste</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownItem shortcut="⌘F" @select="lastCommand = 'Edit → Find'">Find in file…</JDropdownItem>
            <JDropdownItem shortcut="⇧⌘F" @select="lastCommand = 'Edit → Search workspace'">Search in workspace…</JDropdownItem>
          </JMenubarMenu>

          <JMenubarMenu label="Selection">
            <JDropdownItem shortcut="⌘A" @select="lastCommand = 'Selection → Select all'">Select all</JDropdownItem>
            <JDropdownItem shortcut="⌃⇧⌘→" @select="lastCommand = 'Selection → Expand'">Expand selection</JDropdownItem>
            <JDropdownItem shortcut="⌃⇧⌘←" @select="lastCommand = 'Selection → Shrink'">Shrink selection</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownItem shortcut="⌥⌘↑" @select="lastCommand = 'Selection → Cursor above'">Add cursor above</JDropdownItem>
            <JDropdownItem shortcut="⌥⌘↓" @select="lastCommand = 'Selection → Cursor below'">Add cursor below</JDropdownItem>
          </JMenubarMenu>

          <JMenubarMenu label="View">
            <JDropdownItem inset shortcut="⇧⌘P" @select="lastCommand = 'View → Command Palette'">
              Command Palette…
            </JDropdownItem>
            <JDropdownSeparator />
            <JDropdownLabel inset>Editor chrome</JDropdownLabel>
            <JDropdownItem v-model:checked="wordWrap" role="menuitemcheckbox" shortcut="⌥Z">
              Word wrap
            </JDropdownItem>
            <JDropdownItem v-model:checked="showMinimap" role="menuitemcheckbox">
              Show minimap
            </JDropdownItem>
            <JDropdownItem v-model:checked="showBreadcrumbs" role="menuitemcheckbox">
              Show breadcrumbs
            </JDropdownItem>
            <JDropdownSeparator />
            <JDropdownSub label="Panel alignment" inset>
              <JDropdownItem
                v-for="pos in (['bottom', 'right', 'left'] as const)"
                :key="pos"
                role="menuitemradio"
                :checked="panelDock === pos"
                @select="panelDock = pos; lastCommand = `Panel dock → ${pos}`"
              >
                Dock {{ pos }}
              </JDropdownItem>
            </JDropdownSub>
          </JMenubarMenu>

          <JMenubarMenu label="Terminal">
            <JDropdownItem shortcut="⌃⇧`" @select="lastCommand = 'Terminal → New session'">New terminal</JDropdownItem>
            <JDropdownItem shortcut="⌘\\" @select="lastCommand = 'Terminal → Split pane'">Split terminal</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownItem shortcut="⇧⌘B" @select="lastCommand = 'Terminal → Run build task'">Run build task…</JDropdownItem>
            <JDropdownItem disabled>Attach remote debugger (offline)</JDropdownItem>
          </JMenubarMenu>

          <JMenubarMenu label="Help">
            <JDropdownItem @select="lastCommand = 'Help → Keyboard reference'">Keyboard shortcuts reference</JDropdownItem>
            <JDropdownItem @select="lastCommand = 'Help → Release notes'">Release notes</JDropdownItem>
            <JDropdownSeparator />
            <JDropdownItem @select="lastCommand = 'Help → Diagnostics'">Process diagnostics</JDropdownItem>
          </JMenubarMenu>
        </JMenubar>

        <JInline gap="inline" align="center">
          <JBadge v-if="wordWrap" size="sm" variant="outline" tone="neutral">Wrap</JBadge>
          <JBadge v-if="showMinimap" size="sm" variant="outline" tone="neutral">Minimap</JBadge>
          <JBadge size="sm" variant="soft" tone="info">Dock: {{ panelDock }}</JBadge>
          <JBadge size="sm" variant="soft" tone="neutral">{{ lastCommand }}</JBadge>
        </JInline>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Variants & compact IDE chrome"
    description="bordered (default) · surface · plain — combine variant='plain' and size='sm' inside JToolbar for compact desktop window headers."
  >
    <JStack gap="field">
      <JInline gap="item" align="center" wrap>
        <JMenubar variant="surface" aria-label="Surface menu">
          <JMenubarMenu label="Project">
            <JDropdownItem @select="lastCommand = 'Project → Settings'">Project settings</JDropdownItem>
            <JDropdownItem @select="lastCommand = 'Project → Members'">Team members</JDropdownItem>
          </JMenubarMenu>
          <JMenubarMenu label="Deployments">
            <JDropdownItem @select="lastCommand = 'Deployments → Promote'">Promote staging</JDropdownItem>
            <JDropdownItem @select="lastCommand = 'Deployments → Rollback'">Rollback release</JDropdownItem>
          </JMenubarMenu>
          <JMenubarMenu label="Billing" disabled>
            <JDropdownItem>Invoices</JDropdownItem>
          </JMenubarMenu>
        </JMenubar>
        <JBadge size="sm" variant="outline" tone="neutral">variant="surface" + disabled trigger</JBadge>
      </JInline>

      <JToolbar size="sm" border="all" aria-label="Compact window bar">
        <JMenubar size="sm" variant="plain" aria-label="Compact window menu">
          <JMenubarMenu label="File">
            <JDropdownItem shortcut="⌘N" @select="lastCommand = 'Toolbar → New'">New</JDropdownItem>
            <JDropdownItem shortcut="⌘S" @select="lastCommand = 'Toolbar → Save'">Save</JDropdownItem>
          </JMenubarMenu>
          <JMenubarMenu label="Edit">
            <JDropdownItem shortcut="⌘Z" @select="lastCommand = 'Toolbar → Undo'">Undo</JDropdownItem>
            <JDropdownItem shortcut="⌘F" @select="lastCommand = 'Toolbar → Find'">Find</JDropdownItem>
          </JMenubarMenu>
          <JMenubarMenu label="Run">
            <JDropdownItem shortcut="F5" @select="lastCommand = 'Toolbar → Start debugging'">Start debugging</JDropdownItem>
          </JMenubarMenu>
        </JMenubar>
        <JToolbarSpacer />
        <JBadge size="sm" variant="soft" tone="accent">main · clean</JBadge>
      </JToolbar>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML" description="WAI-ARIA role='menubar' + initMenubars().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
