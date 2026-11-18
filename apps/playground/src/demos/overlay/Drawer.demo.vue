<script lang="ts">
export const meta = {
  name: 'Drawer',
  group: 'Overlay',
  order: 8,
  description: 'Edge-docked and floating inset sheets built on native <dialog> with weighted 300ms glide and blur scrim.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JDrawer,
  JButton,
  JField,
  JInput,
  JSwitch,
  JBadge,
  JCard,
  JStack,
  JInline,
  type DrawerSide,
  type DrawerSize,
} from 'jenni-vue';

const envName = ref('production-eu-central');
const domain = ref('api.acme.dev');
const zeroDowntime = ref(true);
const auditTrail = ref(true);

const sides: DrawerSide[] = ['right', 'left', 'bottom', 'top'];
const sizes: DrawerSize[] = ['sm', 'md', 'lg', 'xl'];

const html = `<button class="j-button" data-variant="outline" commandfor="demo-html-drawer-1" command="show-modal">
  Open floating HTML sheet
</button>
<dialog class="j-drawer" id="demo-html-drawer-1" data-side="right" data-size="sm" data-inset closedby="any" aria-labelledby="demo-html-drawer-1-t">
  <header class="j-drawer__header">
    <h2 class="j-drawer__title" id="demo-html-drawer-1-t">Audit snapshot</h2>
    <p class="j-drawer__description">Floating sheet with 8px viewport inset and 14px architectural corners.</p>
  </header>
  <div class="j-drawer__body">
    <p style="margin:0;color:var(--j-fg-muted);font-size:var(--j-text-sm)">
      Built on native <code>&lt;dialog&gt;</code>: focus trap, Escape handling, and zero-shift scroll lock work out of the box.
    </p>
  </div>
  <footer class="j-drawer__footer">
    <button class="j-button" data-size="sm" data-variant="ghost" commandfor="demo-html-drawer-1" command="close">Close</button>
  </footer>
  <button class="j-drawer__close" commandfor="demo-html-drawer-1" command="close" aria-label="Close">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
  </button>
</dialog>`;
</script>

<template>
  <DemoSection
    title="Floating inset sheet vs docked drawer"
    description="Use inset for a Linear / macOS floating inspector (8px viewport margin, 4-corner radius) or omit it for a flush edge-docked panel."
  >
    <JInline gap="item">
      <JDrawer
        inset
        title="Environment inspector"
        description="Floating sheet (data-inset) with poised 300ms deceleration and zero bounce."
      >
        <template #trigger="{ open }">
          <JButton @click="open">Open inset sheet</JButton>
        </template>

        <JStack gap="field">
          <JCard variant="outline" size="sm">
            <JInline justify="between" gap="related">
              <span style="font-size:var(--j-text-sm);font-weight:var(--j-weight-medium)">Cluster status</span>
              <JBadge tone="success" size="sm">Healthy · 99.99%</JBadge>
            </JInline>
          </JCard>

          <JField label="Environment slug">
            <JInput v-model="envName" />
          </JField>
          <JField label="Primary hostname" hint="TLS certificates renew automatically 30 days prior to expiry.">
            <JInput v-model="domain" />
          </JField>
          <JSwitch
            v-model="zeroDowntime"
            placement="end"
            label="Blue-green cutover"
            description="Drain active connections before promoting new instances."
          />
          <JSwitch
            v-model="auditTrail"
            placement="end"
            label="Immutable audit stream"
            description="Forward configuration diffs to compliance archive."
          />
        </JStack>

        <template #footer="{ close }">
          <JButton variant="ghost" @click="close">Cancel</JButton>
          <JButton @click="close">Apply configuration</JButton>
        </template>
      </JDrawer>

      <JDrawer
        title="Docked inspector"
        description="Flush edge-docked right panel anchored full-height to 100dvh."
      >
        <template #trigger="{ open }">
          <JButton variant="outline" @click="open">Open flush drawer</JButton>
        </template>

        <JStack gap="field">
          <JField label="Environment slug">
            <JInput v-model="envName" />
          </JField>
          <JField label="Primary hostname">
            <JInput v-model="domain" />
          </JField>
        </JStack>

        <template #footer="{ close }">
          <JButton variant="ghost" @click="close">Cancel</JButton>
          <JButton @click="close">Save</JButton>
        </template>
      </JDrawer>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Sides"
    description="Anchors cleanly to right, left, bottom, or top with directional @starting-style glide."
  >
    <JInline gap="related">
      <JDrawer
        v-for="s in sides"
        :key="s"
        :side="s"
        size="sm"
        inset
        :title="`Sheet (${s})`"
        description="Press Escape or click the blurred scrim to dismiss."
      >
        <template #trigger="{ open }">
          <JButton variant="outline" @click="open">Side: {{ s }}</JButton>
        </template>
        <p style="margin:0;color:var(--j-fg-muted);font-size:var(--j-text-sm)">
          Positioned with <code>side="{{ s }}"</code> and <code>inset</code>.
        </p>
        <template #footer="{ close }">
          <JButton size="sm" variant="outline" @click="close">Close</JButton>
        </template>
      </JDrawer>
    </JInline>
  </DemoSection>

  <DemoSection
    title="Sizes"
    description="sm (22rem) · md (28rem, default) · lg (36rem) · xl (48rem)."
  >
    <JInline gap="related">
      <JDrawer
        v-for="sz in sizes"
        :key="sz"
        :size="sz"
        :title="`Drawer (${sz})`"
        description="Architectural measure scaled cleanly across viewport breakpoints."
      >
        <template #trigger="{ open }">
          <JButton variant="soft" tone="neutral" @click="open">Size {{ sz }}</JButton>
        </template>
        <p style="margin:0;color:var(--j-fg-muted);font-size:var(--j-text-sm)">
          Using canonical drawer measure <code>size="{{ sz }}"</code>.
        </p>
        <template #footer="{ close }">
          <JButton size="sm" variant="ghost" @click="close">Done</JButton>
        </template>
      </JDrawer>
    </JInline>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Native <dialog class='j-drawer'> + invoker commands + initDrawers().">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
