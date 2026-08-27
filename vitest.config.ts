import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/unit/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    // Vitest 4 dropped environmentMatchGlobs; DOM-dependent files opt in with a
    // `@vitest-environment jsdom` docblock instead.
  },
});
