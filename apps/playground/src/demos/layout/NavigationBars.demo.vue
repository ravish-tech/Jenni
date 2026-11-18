<script lang="ts">
export const meta = {
  name: 'Navigation Bars',
  group: 'Layout',
  order: 3,
  description: 'Collapsible sidebar & icon rail, frosted translucent top bar, and tab/action bottom bars.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JSidebar,
  JSidebarGroup,
  JSidebarItem,
  JTopBar,
  JBottomBar,
  JBottomBarItem,
  JInline,
  JStack,
  JButton,
  JInput,
  JBadge,
  JAvatar,
  JKbd,
} from '@jenni/vue';

const collapsed = ref(false);
const activeItem = ref('issues');
const bottomTab = ref('explore');

const html = `<!-- Collapsible Sidebar (add data-collapsed for 60px rail) -->
<aside class="j-sidebar" aria-label="Main">
  <div class="j-sidebar__header"><strong>Acme</strong></div>
  <nav class="j-sidebar__body">
    <div class="j-sidebar__group">
      <div class="j-sidebar__label">Product</div>
      <a class="j-sidebar__item" href="#issues" aria-current="page">
        <span class="j-sidebar__item-label">Issues</span>
        <span class="j-sidebar__item-badge">14</span>
      </a>
    </div>
  </nav>
</aside>

<!-- Sticky Actions BottomBar -->
<footer class="j-bottombar" data-variant="actions">
  <span>3 unsaved changes</span>
  <div class="j-inline">
    <button class="j-button" data-variant="outline" data-tone="neutral">Discard</button>
    <button class="j-button">Save</button>
  </div>
</footer>`;
</script>

<template>
  <DemoSection
    title="Sidebar & 60px Collapsed Rail"
    description="Toggle between the 248px expanded sidebar and 60px icon-only rail (v-model:collapsed) — glides at 300ms damped deceleration with zero bounce."
  >
    <JStack gap="item" style="width: 100%">
      <JInline gap="related">
        <JButton size="sm" variant="outline" tone="neutral" @click="collapsed = !collapsed">
          {{ collapsed ? 'Expand sidebar (248px)' : 'Collapse to icon rail (60px)' }}
        </JButton>
      </JInline>

      <div style="height: 360px; display: flex; border-radius: var(--j-radius-lg); overflow: hidden; box-shadow: 0 0 0 1px var(--j-border); background: var(--j-bg)">
        <JSidebar v-model:collapsed="collapsed">
          <template #header="{ toggle }">
            <JInline v-if="!collapsed" gap="inline" nowrap>
              <JAvatar initials="LN" size="xs" shape="square" tone="accent" />
              <strong style="font-size: var(--j-text-sm)">Linearity</strong>
            </JInline>
            <JButton size="sm" variant="ghost" tone="neutral" icon-only :title="collapsed ? 'Expand' : 'Collapse'" @click="toggle">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6">
                <path :d="collapsed ? 'M6 4l4 4-4 4' : 'M10 4 6 8l4 4'" />
              </svg>
            </JButton>
          </template>

          <JSidebarGroup label="Workspace">
            <JSidebarItem label="Inbox" badge="5" :active="activeItem === 'inbox'" @click="activeItem = 'inbox'">
              <template #icon>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2" y="3" width="12" height="10" rx="1.8"/><path d="m2 5.5 6 3.5 6-3.5"/></svg>
              </template>
            </JSidebarItem>
            <JSidebarItem label="Active Issues" badge="14" :active="activeItem === 'issues'" @click="activeItem = 'issues'">
              <template #icon>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="8" cy="8" r="5.5"/><circle cx="8" cy="8" r="2"/></svg>
              </template>
            </JSidebarItem>
            <JSidebarItem label="Roadmaps" :active="activeItem === 'roadmaps'" @click="activeItem = 'roadmaps'">
              <template #icon>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5h7M6.5 8h7M4 11.5h6"/></svg>
              </template>
            </JSidebarItem>
          </JSidebarGroup>

          <JSidebarGroup label="Teams">
            <JSidebarItem label="Design Systems" :active="activeItem === 'ds'" @click="activeItem = 'ds'">
              <template #icon>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="8,2 14,13 2,13"/></svg>
              </template>
            </JSidebarItem>
            <JSidebarItem label="Core Runtime" :active="activeItem === 'core'" @click="activeItem = 'core'">
              <template #icon>
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="10" height="10" rx="2"/></svg>
              </template>
            </JSidebarItem>
          </JSidebarGroup>

          <template #footer>
            <JAvatar name="Grace Hopper" size="xs" status="online" @click="collapsed = false" />
            <div v-if="!collapsed" style="min-width: 0; flex: 1">
              <div style="font-size: var(--j-text-xs); font-weight: 600">Grace Hopper</div>
              <div style="font-size: 11px; color: var(--j-fg-muted)">Staff Engineer</div>
            </div>
          </template>
        </JSidebar>

        <div style="flex: 1; padding: var(--j-space-5); color: var(--j-fg-muted); font-size: var(--j-text-sm)">
          Active route: <strong style="color: var(--j-fg)">{{ activeItem }}</strong>
        </div>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection
    title="TopBar (Start · Center · End + Translucent Blur)"
    description="52px canonical height (--j-topbar-h) with sticky frosted backdrop blur over scrolling content."
  >
    <div style="width: 100%; height: 220px; overflow-y: auto; border-radius: var(--j-radius-lg); box-shadow: 0 0 0 1px var(--j-border); background: var(--j-bg)">
      <JTopBar sticky translucent>
        <template #start>
          <span style="font-size: var(--j-text-sm); color: var(--j-fg-muted)">Projects /</span>
          <strong style="font-size: var(--j-text-sm)">Workspace</strong>
          <JBadge size="sm" tone="info">v2.4</JBadge>
        </template>
        <template #center>
          <JInput size="sm" placeholder="Jump to…" style="width: 210px">
            <template #suffix><JKbd size="sm">⌘K</JKbd></template>
          </JInput>
        </template>
        <template #end>
          <JButton size="sm" variant="outline" tone="neutral">Share</JButton>
          <JAvatar name="Alan Turing" size="xs" />
        </template>
      </JTopBar>

      <div style="padding: var(--j-space-5)">
        <JStack gap="item">
          <p style="font-size: var(--j-text-sm); color: var(--j-fg-muted)">
            Scroll inside this frame to observe the <code>translucent</code> 12px backdrop filter diffusing workspace surfaces underneath.
          </p>
          <div style="padding: var(--j-space-3) var(--j-space-4); border-radius: var(--j-radius-md); background: var(--j-surface-2); box-shadow: inset 0 0 0 1px var(--j-border); display: flex; justify-content: space-between; align-items: center; font-size: var(--j-text-xs)">
            <strong style="color: var(--j-fg)">Production Edge · EU-West</strong>
            <JBadge size="sm" variant="soft" tone="success" dot>99.99% SLA</JBadge>
          </div>
          <div style="padding: var(--j-space-3) var(--j-space-4); border-radius: var(--j-radius-md); background: var(--j-surface-2); box-shadow: inset 0 0 0 1px var(--j-border); display: flex; justify-content: space-between; align-items: center; font-size: var(--j-text-xs)">
            <strong style="color: var(--j-fg)">Canary Rollout · US-East</strong>
            <JBadge size="sm" variant="soft" tone="accent">v2.4.1-rc.3</JBadge>
          </div>
          <div style="padding: var(--j-space-3) var(--j-space-4); border-radius: var(--j-radius-md); background: var(--j-surface-2); box-shadow: inset 0 0 0 1px var(--j-border); display: flex; justify-content: space-between; align-items: center; font-size: var(--j-text-xs)">
            <strong style="color: var(--j-fg)">Audit Log Pipeline</strong>
            <span style="color: var(--j-fg-muted)">14.2 ms median latency</span>
          </div>
        </JStack>
      </div>
    </div>
  </DemoSection>

  <DemoSection
    title="BottomBar: Mobile Tabs vs Sticky Action Bar"
    description="60px canonical height (--j-bottombar-h + safe-area-inset-bottom). Supports evenly spaced navigation tabs with active pill indicator OR sticky wizard/checkout actions."
  >
    <JStack gap="group" style="width: 100%; max-width: 520px">
      <div style="border-radius: var(--j-radius-lg); overflow: hidden; box-shadow: 0 0 0 1px var(--j-border)">
        <div style="padding: var(--j-space-3) var(--j-space-4); background: var(--j-surface-2); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
          variant="tabs" (default — mobile navigation bar)
        </div>
        <JBottomBar aria-label="Mobile navigation">
          <JBottomBarItem label="Home" :active="bottomTab === 'home'" @click="bottomTab = 'home'">
            <template #icon>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 9.5 10 3l7 6.5V17H3V9.5Z"/></svg>
            </template>
          </JBottomBarItem>
          <JBottomBarItem label="Explore" :active="bottomTab === 'explore'" @click="bottomTab = 'explore'">
            <template #icon>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7"/><polygon points="8.5,8.5 13.5,6.5 11.5,11.5 6.5,13.5"/></svg>
            </template>
          </JBottomBarItem>
          <JBottomBarItem label="Alerts" badge="7" :active="bottomTab === 'alerts'" @click="bottomTab = 'alerts'">
            <template #icon>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 3a5 5 0 0 1 5 5v3.5l1.5 2H3.5l1.5-2V8a5 5 0 0 1 5-5ZM8.5 16a1.8 1.8 0 0 0 3 0"/></svg>
            </template>
          </JBottomBarItem>
          <JBottomBarItem label="Account" :active="bottomTab === 'account'" @click="bottomTab = 'account'">
            <template #icon>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="7" r="3"/><path d="M4.5 16.5c1.2-2.6 3.2-4 5.5-4s4.3 1.4 5.5 4"/></svg>
            </template>
          </JBottomBarItem>
        </JBottomBar>
      </div>

      <div style="border-radius: var(--j-radius-lg); overflow: hidden; box-shadow: 0 0 0 1px var(--j-border)">
        <div style="padding: var(--j-space-3) var(--j-space-4); background: var(--j-surface-2); font-size: var(--j-text-xs); color: var(--j-fg-muted)">
          variant="actions" (sticky unsaved-changes / checkout bar)
        </div>
        <JBottomBar as="footer" variant="actions">
          <div>
            <div style="font-size: var(--j-text-sm); font-weight: 600">$48.00 / mo</div>
            <div style="font-size: var(--j-text-xs); color: var(--j-fg-muted)">Pro plan · 3 seats</div>
          </div>
          <JInline gap="related">
            <JButton size="sm" variant="outline" tone="neutral">Cancel</JButton>
            <JButton size="sm">Complete upgrade</JButton>
          </JInline>
        </JBottomBar>
      </div>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
