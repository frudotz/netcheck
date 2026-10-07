// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [svelte(), react(), mdx()],
  // Dev toolbar sabit alt menünün üzerine biniyor (Tauri penceresinde sekmeleri örtüyor).
  devToolbar: {
    enabled: false,
  },
  server: {
    port: 1420,
    host: '127.0.0.1',
  },
  vite: {
    resolve: {
      alias: {
        $lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      },
    },
    // Tauri-recommended Vite settings (https://v2.tauri.app/start/frontend/):
    clearScreen: false,
    server: {
      strictPort: true,
      // Rust derleme çıktıları (src-tauri/target) Vite tarafından izlenmez; EBUSY hatalarını önler.
      watch: {
        ignored: ['**/src-tauri/**'],
      },
    },
    envPrefix: ['VITE_', 'TAURI_ENV_*'],
  },
});
