<script lang="ts">
export const meta = {
  name: 'Textarea',
  group: 'Forms',
  order: 6,
  description: 'Multi-line text that grows with its content (field-sizing: content).',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JButton, JCard, JInline, JStack, JTextarea } from 'jenni-vue';

const note = ref('Type here — I grow as you write.\nNo JS needed.');
const comment = ref('');
const max = 280;
const left = computed(() => max - comment.value.length);

const html = `<div class="j-stack" data-gap="item" style="width:100%;max-width:420px">
  <textarea class="j-textarea" placeholder="Write a note…"></textarea>
  <textarea class="j-textarea" data-fixed rows="3" placeholder="Fixed height"></textarea>
  <textarea class="j-textarea" aria-invalid="true">Too short</textarea>
</div>`;
</script>

<template>
  <DemoSection title="Auto-grow" description="Starts at 3 rows, grows to 12, then scrolls. Tune with --j-textarea-min-rows / -max-rows.">
    <JStack gap="item" style="width: 100%; max-width: 420px">
      <JTextarea v-model="note" />
      <JTextarea placeholder="Fixed height (auto-grow off)" :auto-grow="false" rows="3" />
      <JTextarea placeholder="One-line minimum" style="--j-textarea-min-rows: 1" />
    </JStack>
  </DemoSection>

  <DemoSection title="Sizes">
    <JStack gap="item" style="width: 100%; max-width: 420px">
      <JTextarea size="sm" placeholder="Small" />
      <JTextarea placeholder="Medium" />
      <JTextarea size="lg" placeholder="Large" />
    </JStack>
  </DemoSection>

  <DemoSection title="States" description="Focus, invalid, read-only, disabled.">
    <JStack gap="item" style="width: 100%; max-width: 420px">
      <JTextarea tone="info" placeholder="Focus me (info tone)" />
      <JTextarea invalid model-value="Too short" />
      <JTextarea readonly model-value="Read-only. You can select but not edit this text." />
      <JTextarea disabled placeholder="Disabled" />
    </JStack>
  </DemoSection>

  <DemoSection title="Composition" description="Comment box with live character count and footer actions.">
    <JCard size="sm" footer-divider style="width: 100%; max-width: 480px">
      <JTextarea v-model="comment" placeholder="Leave a comment…" :invalid="left < 0" style="--j-textarea-min-rows: 2" />
      <template #footer>
        <JInline justify="between" style="width: 100%">
          <span
            :style="{
              fontSize: 'var(--j-text-xs)',
              fontVariantNumeric: 'tabular-nums',
              color: left < 0 ? 'var(--j-danger)' : 'var(--j-fg-subtle)',
            }"
          >
            {{ left }} characters left
          </span>
          <JInline gap="related">
            <JButton size="sm" variant="ghost" @click="comment = ''">Cancel</JButton>
            <JButton size="sm" :disabled="!comment || left < 0">Comment</JButton>
          </JInline>
        </JInline>
      </template>
    </JCard>
  </DemoSection>

  <DemoSection title="Plain HTML">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
