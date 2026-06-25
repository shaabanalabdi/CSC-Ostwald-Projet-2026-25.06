// ============================================================
// vitest.config.js — Test runner config for the api/.
//
// Defaults are deliberate :
//   - environment: node          → no jsdom / no DOM globals
//   - globals: false             → keep `describe`/`it`/`expect` explicit
//                                   imports for clarity
//   - include: __tests__/*.test  → tests live next to the code they cover
// ============================================================

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.js'],
    // 10s default is generous: bcrypt rounds=4 in tests are still ~10ms,
    // but ESM mock resolution can be slow on first run.
    testTimeout: 10000,
  },
});
c