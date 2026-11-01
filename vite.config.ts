import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // production lives in the GitHub Pages project path
  base: command === 'build' ? '/InaZurvivors/' : '/',
  // no live reload: saving a file must never restart a run in progress
  server: { port: 5173, open: false, hmr: false },
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
