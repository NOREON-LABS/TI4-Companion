import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const r = (p: string) => path.resolve(import.meta.dirname, p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@domain': r('src/domain'),
      '@db': r('src/db'),
      '@server': r('src/server'),
      '@web': r('src/web'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  build: {
    outDir: 'dist/web',
    emptyOutDir: true,
  },
  test: {
    // Domain logic is pure TS — no DOM needed for the unit tests.
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Run files sequentially: avoids EBUSY on Vitest's temp transform-cache under
    // worker-thread contention on Windows. The suite is small, so this is plenty fast.
    fileParallelism: false,
  },
});
