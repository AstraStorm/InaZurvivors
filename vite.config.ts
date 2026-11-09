import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // production lives in the GitHub Pages project path
  base: command === 'build' ? '/InaZurvivors/' : '/',
  // no live reload: saving a file must never restart a run in progress
  // 127.0.0.1 explicitly: plain 'localhost' made Node listen on IPv6 [::1] only, so http://127.0.0.1:5173 did not answer
  // (http://localhost:5173 still works: the browser falls back to 127.0.0.1)
  server: { host: '127.0.0.1', port: 5173, open: false, hmr: false },
  preview: { host: '127.0.0.1' },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}) as never);
