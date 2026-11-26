<script lang="ts">
export const meta = {
  name: 'Description List',
  group: 'Display',
  order: 14.2,
  description: 'Semantic <dl> metadata inspector with horizontal, stacked, and @container-responsive multi-column grid layouts.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JDescriptionList,
  JDescriptionItem,
  JCard,
  JBadge,
  JSegmentedControl,
  JStack,
  JInline,
} from 'jenni-vue';

const activeLayout = ref<'horizontal' | 'stacked' | 'grid'>('horizontal');
const activeVariant = ref<'divided' | 'striped' | 'bordered' | 'plain'>('divided');
const activeSize = ref<'sm' | 'md'>('md');

const layoutOptions = [
  { label: 'Horizontal', value: 'horizontal' },
  { label: 'Stacked', value: 'stacked' },
  { label: 'Grid (2-col)', value: 'grid' },
];

const variantOptions = [
  { label: 'Divided', value: 'divided' },
  { label: 'Striped', value: 'striped' },
  { label: 'Bordered', value: 'bordered' },
  { label: 'Plain', value: 'plain' },
];

const sizeOptions = [
  { label: 'Medium', value: 'md' },
  { label: 'Compact (sm)', value: 'sm' },
];

const inspectorItems = [
  { term: 'Fingerprint (SHA-256)', details: 'e3:b0:c4:42:98:fc:1c:14:9a:fb:f4:c8:99:6f', mono: true },
  { term: 'Issuer Common Name', details: 'Edge Transit Authority R4' },
  { term: 'Key Algorithm', details: 'ECDSA P-256 (secp256r1)', mono: true },
  { term: 'Renewal Window', details: '2026-12-18 00:00 UTC', mono: true },
];

const html = `<dl class="j-dl">
  <div class="j-dl__item">
    <dt class="j-dl__term">Cluster Endpoint</dt>
    <dd class="j-dl__details" data-mono>iad-prod-01.internal:6443</dd>
  </div>
  <div class="j-dl__item">
    <dt class="j-dl__term">Replication Mode</dt>
    <dd class="j-dl__details">Synchronous 3-node Raft quorum</dd>
  </div>
</dl>`;
</script>

<template>
  <DemoSection
    title="Layouts & Divider Variants"
    description="Switch between horizontal key/value rows (which automatically stack inside narrow < 440px sidecars), stacked inspector blocks, and @container grids across four visual treatments."
  >
    <JStack gap="field" style="width:100%;max-width:680px">
      <JInline justify="between" align="center">
        <JSegmentedControl v-model="activeLayout" size="sm" :options="layoutOptions" />
        <JSegmentedControl v-model="activeVariant" size="sm" :options="variantOptions" />
        <JSegmentedControl v-model="activeSize" size="sm" :options="sizeOptions" />
      </JInline>

      <JCard :flush="activeVariant === 'bordered'">
        <JDescriptionList
          :layout="activeLayout"
          :cols="2"
          :variant="activeVariant"
          :size="activeSize"
        >
          <JDescriptionItem term="Deployment ID" details="dpl_01J9XK4R8M2V7P6Q3N" mono />
          <JDescriptionItem term="Health Status">
            <JInline gap="related" align="center">
              <JBadge size="sm" dot variant="soft" tone="success">Healthy</JBadge>
              <span style="color:var(--j-fg-muted);font-size:var(--j-text-xs)">38 / 38 edge PoPs</span>
            </JInline>
          </JDescriptionItem>
          <JDescriptionItem term="Source Revision" details="main @ 9f3c2a18" mono />
          <JDescriptionItem term="Runtime Engine" details="V8 Isolate · Node 22 LTS compat" />
          <JDescriptionItem term="Memory Ceiling" details="512 MiB (peak 184 MiB)" mono />
          <JDescriptionItem
            term="Routing Policy"
            details="Latency-weighted anycast with automatic regional failover."
            :span="2"
          />
        </JDescriptionList>
      </JCard>
    </JStack>
  </DemoSection>

  <DemoSection
    title="3-Column Bordered Specification Grid & Column Spans"
    description="Use layout='grid' with cols=3 and variant='bordered' for dense hardware, billing, or infrastructure manifests; individual items can span 2 or 3 columns."
  >
    <div style="width:100%;max-width:680px">
      <JDescriptionList layout="grid" :cols="3" variant="bordered" size="sm">
        <JDescriptionItem term="Instance Class" details="c8g.4xlarge" mono />
        <JDescriptionItem term="vCPU / Architecture" details="16 vCPU · arm64" mono />
        <JDescriptionItem term="NVMe Scratch" details="2 × 950 GB Gen5" mono />
        <JDescriptionItem term="Private Subnet CIDR" details="10.48.128.0/20" mono />
        <JDescriptionItem
          term="Kernel & Security Profile"
          details="Linux 6.11 · eBPF LSM enforced · FIPS 140-3 crypto module"
          :span="2"
        />
        <JDescriptionItem
          term="Placement Group Affinity"
          details="Spread across three independent power and network fault domains in us-east-1 (az1, az2, az4)."
          :span="3"
        />
      </JDescriptionList>
    </div>
  </DemoSection>

  <DemoSection
    title="Narrow Sidecar Inspector (Data Shorthand)"
    description="Pass an items array with layout='stacked' and size='sm' for compact drawer and inspector panes."
  >
    <JCard size="sm" title="TLS Leaf Certificate" style="width:100%;max-width:340px">
      <JDescriptionList layout="stacked" size="sm" :items="inspectorItems" />
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
