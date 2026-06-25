// ============================================================
// vitest.config.js — Configuration des tests
//
// Distinct de vite.config.js (build) pour garder une séparation claire.
// `defineConfig` côté Vitest réutilise les plugins Vite (resolve.alias)
// automatiquement via `vite.config.js`, donc pas besoin de redéfinir
// les aliases @/ @components/ @schemas/ etc.
// ============================================================

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  // Les aliases ne sont PAS hérités automatiquement de vite.config.js
  // par vitest/config — on les redéclare ici pour résoudre les imports
  // @api/* @schemas/* @utils/* dans les tests.
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@mocks': fileURLToPath(new URL('./src/mocks', import.meta.url)),
      '@pages': fileURLToPath(new URL('./src/pages', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  test: {
    // jsdom : DOM browser-like en Node (nécessaire pour TL.render).
    // Alternative happy-dom : plus rapide mais incomplet pour certains tests.
    environment: 'jsdom',
    // globals: true → expose describe/it/expect sans import explicite,
    // cohérent avec Jest et plus concis dans les fichiers de test.
    globals: true,
    // Fichier chargé une fois avant CHAQUE suite (matchers, MSW server).
    setupFiles: ['./src/test/setup.js'],
    // Excluons explicitement les chemins lourds — vitest scan par défaut
    // sinon, ce qui ralentit le start.
    exclude: ['node_modules', 'dist', 'build', '.husky', 'public'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Cibles de couverture qui comptent — exclut le code décoratif/config.
      include: ['src/utils/**', 'src/schemas/**', 'src/api/**'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/mocks/**',
        // Les hooks framer-motion (useParallax, useSpotlight) demandent un
        // env browser-like trop poussé pour le ROI — testés via les pages.
        'src/hooks/**',
      ],
    },
  },
});
