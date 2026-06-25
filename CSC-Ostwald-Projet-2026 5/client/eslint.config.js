import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig, globalIgnores } from 'eslint/config';

// Pattern partagé pour les variables non utilisées.
const noUnusedVarsOptions = {
  varsIgnorePattern: '^[A-Z_]', // UPPERCASE = constantes intentionnellement gardées
  argsIgnorePattern: '^_', // _arg = paramètre non utilisé volontairement
  caughtErrorsIgnorePattern: '^_',
  destructuredArrayIgnorePattern: '^_',
};

export default defineConfig([
  // Dossiers à ignorer (sortis du scope d'analyse ESLint)
  globalIgnores([
    'dist',
    'build',
    'coverage',
    'node_modules',
    'public/leaflet.css',
    // MSW génère mockServiceWorker.js via `npx msw init public/` — fichier
    // versionné mais non écrit à la main, on ne le lint pas.
    'public/mockServiceWorker.js',
  ]),

  // ──────────────────────────────────────────────────────────────────────
  // FICHIERS JS / JSX
  // ──────────────────────────────────────────────────────────────────────
  {
    files: ['**/*.{js,jsx}'],
    plugins: { react },
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    settings: {
      react: { version: 'detect' },
    },
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // ── React JSX-awareness (sans tout `recommended` qui est trop strict) ──
      // jsx-uses-vars : marque les variables utilisées en JSX comme "used"
      // → corrige le faux positif `'m' is defined but never used` sur les
      //   imports framer-motion (<m.div>) sans toucher au reste.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',

      // ── Hygiène générale ─────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-multi-assign': 'error',
      'no-implicit-coercion': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'multi-line'],

      // ── React Hooks ──────────────────────────────────────────────
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── Accessibility (jsx-a11y) ─────────────────────────────────
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'warn',

      // ── Code smell ───────────────────────────────────────────────
      'no-duplicate-imports': 'error',
      'no-useless-concat': 'warn',
      'no-useless-return': 'warn',
      'object-shorthand': ['warn', 'always'],

      'no-unused-vars': ['error', noUnusedVarsOptions],
    },
  },

  // ──────────────────────────────────────────────────────────────────────
  // FICHIERS NODE (vite.config, scripts, config ESLint)
  // ──────────────────────────────────────────────────────────────────────
  {
    files: ['vite.config.js', 'eslint.config.js', 'scripts/**/*.{js,mjs}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
    },
  },
]);
