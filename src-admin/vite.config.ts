import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const adminRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: adminRoot,
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': adminRoot,
    },
  },
  server: {
    host: '127.0.0.1',
    port: 1422,
    strictPort: true,
  },
  build: {
    outDir: '../dist-admin',
    emptyOutDir: true,
  },
});
