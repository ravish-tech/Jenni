<script setup lang="ts">
// Minimal stroke icon set (Lucide-style paths), 16px by default.
const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 16 });

const paths: Record<string, string> = {
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35',
  menu: 'M3 6h18M3 12h18M3 18h18',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
  monitor: 'M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 17h8m-4-4v4',
  sliders: 'M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6',
  panel: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm10 0v18',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',
  check: 'M20 6 9 17l-5-5',
  undo: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
  trash: 'M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  copy: 'M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2ZM4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2',
  chevron: 'm6 9 6 6 6-6',
  'chevron-right': 'm9 18 6-6-6-6',
  plus: 'M12 5v14m-7-7h14',
  x: 'M18 6 6 18M6 6l12 12',
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2m3.45-6.89L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  sparkle: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z',
  layout: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm0 4h18M9 9v12',
  screens: 'M3 4h7v7H3V4Zm11 0h7v5h-7V4Zm0 9h7v7h-7v-7ZM3 15h7v5H3v-5Z',
  ruler: 'M3 8h18v8H3V8Zm4 0v4m4-4v3m4-3v4m4-4v3',
  tablet: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm6 16h.01',
  smartphone: 'M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm5 16h.01',
  laptop: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V5Zm-2 13h20',
  expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  minimize: 'M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7',
  'arrow-left': 'M19 12H5m6-6-6 6 6 6',
  terminal: 'm4 17 6-6-6-6m8 14h8',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z',
  layers: 'm12 2 10 5-10 5L2 7l10-5Zm10 10-10 5-10-5m20 5-10 5-10-5',
  compass: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4.24-14.24-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12Z',
  lock: 'M7 11V7a5 5 0 0 1 10 0v4M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z',
  columns: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Zm6-2v18m6-18v18',
  gauge: 'm12 14 4-4M3.34 19a10 10 0 1 1 17.32 0',
};
</script>

<template>
  <svg
    class="pg-icon"
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[props.name] ?? ''" />
  </svg>
</template>
