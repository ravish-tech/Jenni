<script setup lang="ts">
import { useAttrs } from 'vue';
import { sizeAttr, useFieldAttrs, type Size, type Tone } from './types';

defineOptions({ inheritAttrs: false });

const model = defineModel<string>();
const props = withDefaults(
  defineProps<{ size?: Size; tone?: Tone; invalid?: boolean; autoGrow?: boolean }>(),
  { autoGrow: true },
);

const attrs = useAttrs();
const field = useFieldAttrs(() => props.invalid);
</script>

<template>
  <textarea
    v-model="model"
    class="j-textarea"
    :data-size="sizeAttr(size)"
    :data-tone="tone"
    :data-fixed="autoGrow ? undefined : ''"
    v-bind="{ ...field, ...attrs }"
  />
</template>
