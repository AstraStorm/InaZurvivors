import { defineConfig } from 'vite';

export default defineConfig(() => ({
  // relative paths: the same build works at a domain root and under a GitHub Pages project path (/InaZurvivors/)
  base: './',
  // no live reload: saving a file must never restart a run in progress
  server: { port: 5173, open: false, hmr: false },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
}) as never);
