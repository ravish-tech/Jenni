<script lang="ts">
export const meta = {
  name: 'Tag Input',
  group: 'Forms',
  order: 9,
  description: 'Multi-line wrapping token input with removable chips, comma/Enter commit, and maxTags.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JField, JStack, JTagInput } from 'jenni-vue';

const topics = ref(['design-system', 'oklch', 'a11y']);
const sizeTags = reactive({
  sm: ['compact', 'sm'],
  md: ['default', 'md'],
  lg: ['spacious', 'lg'],
});
const reviewers = ref(['ada@acme.dev', 'dieter@braun.de']);
const limited = ref(['v2.0', 'forms']);
const invalidTags = ref(['unverified-domain']);

const html = `<div class="j-tag-input" style="max-width:420px">
  <span class="j-tag-input__tag" data-value="architecture">
    <span class="j-tag-input__tag-label">architecture</span>
    <button type="button" class="j-tag-input__remove" aria-label="Remove architecture">×</button>
  </span>
  <span class="j-tag-input__tag" data-value="tokens">
    <span class="j-tag-input__tag-label">tokens</span>
    <button type="button" class="j-tag-input__remove" aria-label="Remove tokens">×</button>
  </span>
  <input type="text" class="j-tag-input__field" placeholder="Add tag…">
</div>`;
</script>

<template>
  <DemoSection title="Basic" description="Press Enter or comma to commit a tag; Backspace on empty field removes the last chip.">
    <JStack gap="field" style="width: 100%; max-width: 440px">
      <JField label="Issue labels" hint="Try typing a label and pressing Enter or pasting 'ui, tokens, motion'.">
        <JTagInput v-model="topics" placeholder="Add label…" />
      </JField>
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes & Tones" description="sm · md · lg and tonal chips via data-tone.">
    <JStack gap="item" style="width: 100%; max-width: 440px">
      <JTagInput v-model="sizeTags.sm" size="sm" placeholder="Small…" aria-label="Small tags" />
      <JTagInput v-model="sizeTags.md" placeholder="Medium…" aria-label="Medium tags" />
      <JTagInput v-model="sizeTags.lg" size="lg" placeholder="Large…" aria-label="Large tags" />
      <JTagInput v-model="reviewers" tone="accent" placeholder="Invite reviewer…" aria-label="Reviewers" />
    </JStack>
  </DemoSection>

  <DemoSection title="Limits & States" description="Respects maxTags, invalid validation state, and disabled lock.">
    <JCard size="sm" style="width: 100%; max-width: 440px">
      <JStack gap="field">
        <JField label="Release milestones" :hint="`${limited.length} / 3 tags used`">
          <JTagInput v-model="limited" :max-tags="3" placeholder="Up to 3 tags…" />
        </JField>
        <JField label="Allowed origins" error="Domain must include an explicit scheme.">
          <JTagInput v-model="invalidTags" invalid placeholder="Add domain…" />
        </JField>
        <JField label="System tags (read-only)">
          <JTagInput :model-value="['core', 'immutable']" disabled />
        </JField>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML" description="initTagInputs() adds chip creation, removal, and Backspace handling.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
