import { defineConfig } from 'vitest/config';

// Unit tests only. Test files live next to the module they cover under src/,
// where Astro leaves them alone: it builds src/pages and whatever those pages
// import, and nothing imports a *.test.ts file.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
