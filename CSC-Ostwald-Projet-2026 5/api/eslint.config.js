// ============================================================
// ESLint flat config for the backend (Node + Express, ES Modules).
// ============================================================

import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Allow console.warn/error for server logs; flag plain console.log
      // (use a real logger in production).
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Permit unused args/vars prefixed with `_` (e.g. errorHandler's `_next`)
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
