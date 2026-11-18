<script lang="ts">
export const meta = {
  name: 'Tabs',
  group: 'Overlay',
  order: 10,
  description: 'Organizes views with roving focus, a damped FLIP indicator glide and zero-hop panel fades.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JTabs,
  JTabList,
  JTab,
  JTabPanel,
  JCard,
  JField,
  JInput,
  JSwitch,
  JButton,
  JBadge,
  JStack,
} from '@jenni/vue';

const activeSettings = ref('general');
const pillTab = ref('preview');
const workspaceName = ref('Meridian Studio');
const autoDeploy = ref(true);
const sizes = ['sm', 'md', 'lg'] as const;

const html = `<div style="width:100%;max-width:480px">
  <div class="j-tabs" data-variant="pill">
    <div class="j-tabs__list" role="tablist" aria-label="Release channel">
      <button class="j-tabs__tab" role="tab" aria-selected="true" aria-controls="demo-html-tab-p1">Stable</button>
      <button class="j-tabs__tab" role="tab" aria-selected="false" aria-controls="demo-html-tab-p2">Candidate</button>
      <button class="j-tabs__tab" role="tab" aria-selected="false" aria-controls="demo-html-tab-p3">Nightly</button>
    </div>
    <div class="j-tabs__panel" role="tabpanel" id="demo-html-tab-p1">
      Pinned to verified semantic releases (v0.2.0).
    </div>
    <div class="j-tabs__panel" role="tabpanel" id="demo-html-tab-p2" hidden>
      Weekly release candidates for staging validation.
    </div>
    <div class="j-tabs__panel" role="tabpanel" id="demo-html-tab-p3" hidden>
      Built automatically from main on every merge.
    </div>
  </div>
</div>`;
</script>

<template>
  <DemoSection title="Variants" description="underline (default) and pill segmented controls — indicator glides over 300ms while panels cross-fade calmly in place.">
    <JStack gap="group" style="width:100%;max-width:520px">
      <JTabs default-value="overview" variant="underline">
        <JTabList aria-label="Project sections">
          <JTab value="overview">Overview</JTab>
          <JTab value="deployments">
            Deployments
            <JBadge size="sm" variant="soft" tone="neutral">12</JBadge>
          </JTab>
          <JTab value="telemetry">Telemetry</JTab>
          <JTab value="logs" disabled>Audit logs</JTab>
        </JTabList>
        <JTabPanel value="overview">
          <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">
            Production is healthy across 3 edge regions. Median response time is 28 ms.
          </p>
        </JTabPanel>
        <JTabPanel value="deployments">
          <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">
            Release <code>8f3c12a</code> promoted to production 4 minutes ago on <code>main</code>.
          </p>
        </JTabPanel>
        <JTabPanel value="telemetry">
          <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">
            99.98% availability over the trailing 30 days with zero error budget burn.
          </p>
        </JTabPanel>
      </JTabs>

      <JTabs v-model="pillTab" variant="pill">
        <JTabList aria-label="Inspector mode">
          <JTab value="preview">Preview</JTab>
          <JTab value="markup">Markup</JTab>
          <JTab value="tokens">Tokens</JTab>
        </JTabList>
        <JTabPanel value="preview">
          <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">Live interactive stage with real-time density and theme adaptation.</p>
        </JTabPanel>
        <JTabPanel value="markup">
          <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">Identical semantic HTML shared across vanilla CSS, Vue 3 and React 19.</p>
        </JTabPanel>
        <JTabPanel value="tokens">
          <p style="color:var(--j-fg-muted);font-size:var(--j-text-md)">Poised OKLCH surfaces and damped zero-overshoot motion curves.</p>
        </JTabPanel>
      </JTabs>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes & full width" description="sm · md (default) · lg, plus full to distribute equal column widths.">
    <JStack gap="field" style="width:100%;max-width:520px">
      <div v-for="s in sizes" :key="s">
        <JTabs default-value="day" variant="pill" :size="s">
          <JTabList :aria-label="`Range ${s}`">
            <JTab value="day">24h</JTab>
            <JTab value="week">7d</JTab>
            <JTab value="month">30d</JTab>
          </JTabList>
        </JTabs>
      </div>

      <JTabs default-value="monthly" variant="pill" full>
        <JTabList aria-label="Billing cycle">
          <JTab value="monthly">Monthly billing</JTab>
          <JTab value="annual">
            Annual
            <JBadge size="sm" tone="success">-20%</JBadge>
          </JTab>
        </JTabList>
      </JTabs>
    </JStack>
  </DemoSection>

  <DemoSection title="Vertical & settings composition" description="orientation='vertical' pairs a side keyline rail with ArrowUp / ArrowDown roving focus.">
    <div style="width:100%;max-width:560px">
      <JTabs v-model="activeSettings" orientation="vertical">
        <JTabList aria-label="Workspace settings">
          <JTab value="general">General</JTab>
          <JTab value="builds">Builds</JTab>
          <JTab value="security">Security</JTab>
        </JTabList>

        <JTabPanel value="general">
          <JCard title="General settings" description="Update how your workspace appears to collaborators.">
            <JField label="Workspace name">
              <JInput v-model="workspaceName" />
            </JField>
            <template #footer>
              <JButton size="sm">Save changes</JButton>
            </template>
          </JCard>
        </JTabPanel>

        <JTabPanel value="builds">
          <JCard title="Build pipeline" description="Configure automatic branch preview environments.">
            <JSwitch
              v-model="autoDeploy"
              placement="end"
              label="Preview deployments"
              description="Build every pull request on an isolated preview subdomain."
            />
          </JCard>
        </JTabPanel>

        <JTabPanel value="security">
          <JCard title="Two-factor authentication" description="Require hardware security keys or TOTP across all members.">
            <JBadge tone="success" dot>Enforced organization-wide</JBadge>
          </JCard>
        </JTabPanel>
      </JTabs>
    </div>
  </DemoSection>

  <DemoSection title="Plain HTML" description="Pure CSS + initTabs() sliding indicator.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
