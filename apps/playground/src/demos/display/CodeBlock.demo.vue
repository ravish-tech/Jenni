<script lang="ts">
export const meta = {
  name: 'Code Block & Copy',
  group: 'Display',
  order: 11.5,
  wide: true,
  description:
    'Zero-dependency syntax-highlighted code blocks, unified diff views, tabular line gutters, and tactile clipboard copy buttons.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import {
  JCodeBlock,
  JCopyButton,
  JSegmentedControl,
  JSwitch,
  JBadge,
  JStack,
  JInline,
} from 'jenni-vue';

type SampleKey = 'ts' | 'vue' | 'sql' | 'python' | 'yaml' | 'bash';

const activeLang = ref<SampleKey>('ts');
const activeVariant = ref<'outline' | 'surface' | 'contrast'>('outline');
const showLineNumbers = ref(true);
const wrapLines = ref(false);
const lastCopied = ref<string | null>(null);

const langOptions = [
  { label: 'TypeScript', value: 'ts' },
  { label: 'Vue SFC', value: 'vue' },
  { label: 'SQL', value: 'sql' },
  { label: 'Python', value: 'python' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Bash', value: 'bash' },
];

const variantOptions = [
  { label: 'Outline', value: 'outline' },
  { label: 'Surface', value: 'surface' },
  { label: 'Contrast', value: 'contrast' },
];

const samples: Record<
  SampleKey,
  { filename: string; language: string; highlights: number[]; code: string }
> = {
  ts: {
    filename: 'src/telemetry/ingest.ts',
    language: 'ts',
    highlights: [9, 10, 11],
    code: `import type { BatchOptions, SpanRecord } from './types';

export async function flushTelemetryBatch(
  spans: readonly SpanRecord[],
  options: BatchOptions = { retries: 3, timeoutMs: 4_500 },
): Promise<{ accepted: number; latencyMs: number }> {
  const startedAt = performance.now();
  const active = spans.filter((span) => !span.dropped && span.durationMs >= 0.5);
  if (active.length === 0) {
    return { accepted: 0, latencyMs: 0 };
  }

  const response = await fetch('/v2/traces/commit', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count: active.length, spans: active }),
  });

  if (!response.ok) {
    throw new Error(\`Ingest rejected with HTTP \${response.status}\`);
  }
  return {
    accepted: active.length,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}`,
  },
  vue: {
    filename: 'src/components/ReleaseCard.vue',
    language: 'vue',
    highlights: [11, 12],
    code: `<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  version: string;
  healthy: boolean;
}>();

const label = computed(() => (props.healthy ? 'Operational' : 'Degraded'));
<\/script>

<template>
  <article class="release-card" :data-healthy="healthy">
    <strong>{{ version }}</strong>
    <span>{{ label }}</span>
  </article>
</template>`,
  },
  sql: {
    filename: 'migrations/042_rollups.sql',
    language: 'sql',
    highlights: [5, 6],
    code: `-- Hourly p95 latency rollup across active edge regions
SELECT
  region_code,
  DATE_TRUNC('hour', recorded_at) AS bucket_hour,
  COUNT(*) AS total_requests,
  ROUND(AVG(duration_ms)::NUMERIC, 2) AS mean_ms
FROM edge_request_spans
WHERE status_code BETWEEN 200 AND 299
  AND recorded_at >= NOW() - INTERVAL '24 hours'
GROUP BY region_code, bucket_hour
ORDER BY bucket_hour DESC, total_requests DESC
LIMIT 25;`,
  },
  python: {
    filename: 'workers/quantize.py',
    language: 'python',
    highlights: [6, 7],
    code: `from dataclasses import dataclass
from typing import Sequence

@dataclass(frozen=True)
class CalibrationSummary:
    scale: float
    clipped_ratio: float

def calibrate_percentile(values: Sequence[float], clip: float = 0.995) -> CalibrationSummary:
    """Compute symmetric int8 scale factor without outlier distortion."""
    ordered = sorted(abs(v) for v in values)
    pivot = ordered[min(len(ordered) - 1, int(len(ordered) * clip))]
    scale = max(pivot / 127.0, 1e-6)
    clipped = sum(1 for v in ordered if v > pivot) / max(len(ordered), 1)
    return CalibrationSummary(scale=scale, clipped_ratio=round(clipped, 4))`,
  },
  yaml: {
    filename: 'deploy/canary.yaml',
    language: 'yaml',
    highlights: [8, 9, 10],
    code: `---
service: realtime-gateway
runtime: node22
replicas: 6
canary:
  enabled: true
  weightPercent: 15
  maxErrorRate: 0.002
  regions:
    - us-east-1
    - eu-central-1
    - ap-northeast-1`,
  },
  bash: {
    filename: 'scripts/verify-release.sh',
    language: 'bash',
    highlights: [4, 5],
    code: `#!/usr/bin/env bash
set -euo pipefail

RELEASE_TAG="\${1:-v2.4.0}"
echo "Verifying artifact checksums for \${RELEASE_TAG}..."

shasum --algorithm 256 --check dist/SHA256SUMS
curl --fail --silent --max-time 10 "https://status.example.internal/healthz" | grep -q "ok"`,
  },
};

const currentSample = computed(() => samples[activeLang.value]);

const unifiedDiffCode = `@@ -18,9 +18,11 @@ export function createPoolConfig(env: NodeJS.ProcessEnv) {
   return {
     host: env.DB_HOST ?? '127.0.0.1',
     port: Number(env.DB_PORT ?? 5432),
-    maxConnections: 10,
-    idleTimeoutMs: 60_000,
+    maxConnections: Number(env.DB_POOL_MAX ?? 32),
+    idleTimeoutMs: 15_000,
+    statementTimeoutMs: 5_000,
     ssl: env.NODE_ENV === 'production',
+    applicationName: 'billing-ledger-worker',
   };
 }`;

const cliInstall = 'npx create-workspace@latest my-app --template minimal';
const apiToken = 'wk_live_9f82c4e10b7d43a6bc2048e5f913a7d2';

function recordCopy(label: string) {
  lastCopied.value = label;
}

const html = `<div class="j-code-block" data-lang="ts" data-line-numbers data-highlight-lines="2">
  <div class="j-code-block__header">
    <div class="j-code-block__meta">
      <span class="j-code-block__filename">math.ts</span>
      <span class="j-code-block__lang">ts</span>
    </div>
    <div class="j-code-block__actions">
      <button type="button" class="j-copy-button" data-size="xs" aria-label="Copy code"></button>
    </div>
  </div>
  <div class="j-code-block__body">
    <pre class="j-code-block__pre"><code class="j-code-block__code">export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}</code></pre>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Interactive Syntax & Surface Explorer"
    description="Zero-dependency, XSS-safe span tokenization across TypeScript, Vue SFC, SQL, Python, YAML, and Bash with tabular line gutters, highlighted lines, and outline, surface, or obsidian contrast chrome."
  >
    <JStack gap="field">
      <JInline justify="between" align="center" wrap>
        <JSegmentedControl v-model="activeLang" size="sm" :options="langOptions" />
        <JInline gap="item" align="center" wrap>
          <JSegmentedControl v-model="activeVariant" size="sm" :options="variantOptions" />
          <JSwitch v-model="showLineNumbers" size="sm" label="Line numbers" />
          <JSwitch v-model="wrapLines" size="sm" label="Soft wrap" />
        </JInline>
      </JInline>

      <JCodeBlock
        :code="currentSample.code"
        :language="currentSample.language"
        :filename="currentSample.filename"
        :line-numbers="showLineNumbers"
        :highlight-lines="currentSample.highlights"
        :variant="activeVariant"
        :wrap="wrapLines"
        @copy="recordCopy(currentSample.filename)"
      >
        <template #actions>
          <JBadge size="sm" variant="outline" tone="neutral">UTF-8</JBadge>
        </template>
      </JCodeBlock>
    </JStack>
  </DemoSection>

  <DemoSection
    title="Unified Diff & Syntax-Preserving Diffs"
    description="Pass language='diff' for raw unified patches, or combine diff with any language (such as language='ts' diff) to render added, deleted, and hunk rows alongside full token highlighting."
  >
    <JStack gap="field">
      <JCodeBlock
        filename="packages/db/src/pool.ts"
        language="ts"
        diff
        line-numbers
        :start-line="17"
        :code="unifiedDiffCode"
      >
        <template #actions>
          <JBadge size="sm" variant="soft" tone="success">+4</JBadge>
          <JBadge size="sm" variant="soft" tone="danger">-2</JBadge>
        </template>
      </JCodeBlock>

      <JCodeBlock :code="cliInstall" />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Standalone CopyButton Variants & Sizes"
    description="Crisp 24x24 geometric-precision clipboard-to-checkmark feedback with SSR-safe Clipboard API and hidden textarea fallback."
  >
    <JStack gap="field">
      <JInline gap="item" align="center" wrap>
        <JCopyButton :value="apiToken" size="xs" variant="ghost" label="Ghost XS" @copy="recordCopy('Ghost XS')" />
        <JCopyButton :value="apiToken" size="sm" variant="ghost" label="Ghost SM" @copy="recordCopy('Ghost SM')" />
        <JCopyButton :value="apiToken" size="sm" variant="soft" label="Soft SM" @copy="recordCopy('Soft SM')" />
        <JCopyButton :value="apiToken" size="sm" variant="outline" label="Outline SM" @copy="recordCopy('Outline SM')" />
        <JCopyButton :value="apiToken" size="md" variant="outline" label="Copy API key" copied-label="Key copied" @copy="recordCopy('Outline MD')" />
        <JCopyButton :value="apiToken" size="sm" variant="outline" aria-label="Copy token icon only" @copy="recordCopy('Icon-only')" />
        <JCopyButton :value="apiToken" size="sm" variant="outline" label="Disabled" disabled />
      </JInline>

      <JInline v-if="lastCopied" gap="related" align="center">
        <JBadge size="sm" dot variant="soft" tone="success">Clipboard updated</JBadge>
        <span class="pg-muted">Last copied source: {{ lastCopied }}</span>
      </JInline>
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
