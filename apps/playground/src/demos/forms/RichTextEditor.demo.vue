<script lang="ts">
export const meta = {
  name: 'Rich Text Editor',
  group: 'Forms',
  order: 19,
  description: 'Composable editorial prose editor with active formatting reflection, inline link bar, and tabular word/character counts.',
  status: 'stable',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JField, JRichTextEditor, JStack, type RichTextAction } from 'jenni-vue';

const docsUrl = 'https://studio.design/tokens';

const releaseNotes = ref(
  `<h2>Release v0.4 — Spatial Density &amp; Forms</h2>` +
    `<p>Every control now honors <code>--j-density</code> across compact (<strong>0.65×</strong>), default (<strong>1.0×</strong>), and comfortable (<strong>1.15×</strong>) modes with zero overshoot.</p>` +
    `<blockquote>Architectural calm comes from aligned baselines, quiet borders, and honest motion.</blockquote>` +
    `<ul><li>Anchored <strong>Date</strong>, <strong>Time</strong>, and <strong>Color</strong> inspectors</li><li>Inline <a href="${docsUrl}" target="_blank" rel="noopener noreferrer">design token reference</a> without modal prompts</li></ul>`,
);

const commentBody = ref('');
const invalidDraft = ref('');
const readonlySpec = ref(
  `<h3>Deployment Freeze Notice</h3><p>Production schema migrations pause between <code>14:00 UTC</code> and <code>16:00 UTC</code> while edge caches warm.</p>`,
);

const compactToolbar: RichTextAction[][] = [
  ['bold', 'italic', 'code', 'link'],
  ['bulletList', 'orderedList', 'clear'],
];

const html = `<div class="j-rich-text" style="max-width:620px">
  <div class="j-rich-text__content" contenteditable="true" data-placeholder="Write release notes…">
    <h2>Release summary</h2>
    <p>Compose clean HTML with <strong>⌘B</strong>, <em>⌘I</em>, and <code>⌘E</code>.</p>
  </div>
</div>`;
</script>

<template>
  <DemoSection
    title="Editorial Prose Surface"
    description="Active mark reflection via selectionchange, inline link bar (⌘K), keyboard shortcuts (⌘B · ⌘I · ⌘U · ⌘E), and live tabular word/char counters."
  >
    <div style="width: 100%; max-width: 660px">
      <JField label="Release announcement" hint="Select text to inspect active toolbar states or press ⌘K to edit links.">
        <JRichTextEditor v-model="releaseNotes" :min-rows="6" />
      </JField>
    </div>
  </DemoSection>

  <DemoSection
    title="Compact Comment Composer"
    description="Custom minimal toolbar subset and compact row height for issue threads and review drawers."
  >
    <div style="width: 100%; max-width: 560px">
      <JField label="Leave a review note">
        <JRichTextEditor
          v-model="commentBody"
          :toolbar="compactToolbar"
          :min-rows="3"
          placeholder="Add context, inline code, or bullet points…"
        />
      </JField>
    </div>
  </DemoSection>

  <DemoSection
    title="Validation, Read-Only & Disabled States"
    description="Invalid field ring when required prose is empty, calm read-only surface, and disabled lock."
  >
    <JStack gap="field" style="width: 100%; max-width: 560px">
      <JField
        label="Postmortem summary"
        required
        :invalid="!invalidDraft"
        :error="!invalidDraft ? 'Summary cannot be empty before publishing.' : undefined"
      >
        <JRichTextEditor
          v-model="invalidDraft"
          :toolbar="compactToolbar"
          :min-rows="2"
          :invalid="!invalidDraft"
          placeholder="Describe root cause and mitigation…"
        />
      </JField>

      <JField label="Pinned change advisory (read-only)">
        <JRichTextEditor v-model="readonlySpec" readonly :min-rows="2" />
      </JField>

      <JRichTextEditor
        model-value="<p>Editing is locked while approval is pending.</p>"
        disabled
        :min-rows="2"
        :show-footer="false"
      />
    </JStack>
  </DemoSection>

  <DemoSection
    title="Plain HTML"
    description="initRichTextEditors() mounts the formatting toolbar, inline link bar, shortcuts, and word/char footer onto .j-rich-text."
  >
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
