<script lang="ts">
export const meta = {
  name: 'File Upload',
  group: 'Forms',
  order: 15,
  description: 'Calm dashed dropzone and compact attachment row with byte formatting and size validation.',
  status: 'draft',
};
</script>

<script setup lang="ts">
import { ref } from 'vue';
import { DemoSection, DemoCode } from '@/kit';
import { JCard, JField, JFileUpload, JStack } from 'jenni-vue';

function sampleFile(name: string, bytes: number, type: string): File {
  const buf = new Uint8Array(bytes);
  return new File([buf], name, { type });
}

const assets = ref<File[]>([
  sampleFile('design-tokens-v2.json', 18_432, 'application/json'),
  sampleFile('architecture-spec.pdf', 412_672, 'application/pdf'),
]);
const compactFiles = ref<File[]>([]);

const html = `<div class="j-file-upload" data-max-size="2097152" style="max-width:440px">
  <label class="j-file-upload__dropzone">
    <input type="file" class="j-file-upload__input" multiple>
    <span class="j-file-upload__icon" aria-hidden="true">
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 10.5V3M5 5.5 8 2.5l3 3"/><path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2"/>
      </svg>
    </span>
    <span class="j-file-upload__content">
      <span class="j-file-upload__title">Drop files here or <span class="j-file-upload__browse">browse</span></span>
      <span class="j-file-upload__hint">PNG, SVG, PDF up to 2 MB</span>
    </span>
  </label>
</div>`;
</script>

<template>
  <DemoSection title="Dropzone" description="Drag files onto the surface for a poised 150ms tonal highlight, or click to browse.">
    <div style="width: 100%; max-width: 460px">
      <JFileUpload
        v-model="assets"
        accept=".json,.pdf,.png,.svg,image/*"
        :max-size="2 * 1024 * 1024"
        hint="PNG, SVG, PDF, or JSON · max 2.0 MB per file"
      />
    </div>
  </DemoSection>

  <DemoSection title="Compact Inline Row" description="data-variant=&quot;compact&quot; fits dense forms, drawers, and comment composers.">
    <JCard title="Submit bug report" size="sm" style="width: 100%; max-width: 460px">
      <JStack gap="field">
        <JField label="Reproduction logs" hint="Optional HAR, console log, or screenshot (max 500 KB to test error state).">
          <JFileUpload
            v-model="compactFiles"
            variant="compact"
            :max-size="500 * 1024"
            label="Attach diagnostic file"
            hint="Max 500 KB"
          />
        </JField>
      </JStack>
    </JCard>
  </DemoSection>

  <DemoSection title="States" description="Disabled dropzone and tonal variants.">
    <JStack gap="field" style="width: 100%; max-width: 460px">
      <JFileUpload variant="compact" tone="success" label="Upload signed agreement" hint="PDF only · max 5 MB" accept=".pdf" />
      <JFileUpload variant="compact" disabled label="Uploads locked during deployment" hint="Read-only state" />
    </JStack>
  </DemoSection>

  <DemoSection title="Plain HTML" description="initFileUploads() manages dragover state, file list rendering, and data-max-size checks.">
    <DemoCode lang="html" :code="html" />
  </DemoSection>
</template>
