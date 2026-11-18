import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { jenniFeedback } from './feedback-plugin.ts';
import { jenniBenchmark } from './benchmark-plugin.ts';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    vue(),
    // Dev-only REST endpoint for playground notes → <repo>/feedback/notes.json + TODO.md
    jenniFeedback({ dir: fileURLToPath(new URL('../../feedback', import.meta.url)) }),
    // Benchmark suite middleware (dev) & static asset emitter (production / GitHub Pages)
    jenniBenchmark({ benchDir: fileURLToPath(new URL('../benchmark', import.meta.url)) }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@jenni/vue': fileURLToPath(new URL('../../packages/vue/src/index.ts', import.meta.url)),
      '@jenni/react': fileURLToPath(new URL('../../packages/react/src/index.ts', import.meta.url)),
    },
  },
  server: { port: 5173 },
});
