<script setup lang="ts">
import type { Status } from '@/lib/registry';
defineProps<{ status: Status }>();
</script>

<template>
  <span class="pg-pill" :data-status="status"><span class="pg-status-dot" :data-status="status" />{{ status }}</span>
</template>
