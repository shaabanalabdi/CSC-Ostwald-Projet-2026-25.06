import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  // ── Base public path ───────────────────────────────────────
  // Root (`/`) en dev, sur Vercel et en local. Sur GitHub Pages le
  // site est servi sous un sous-dossier (`/<repo>/`), donc le workflow
  // CI exporte `VITE_BASE_PATH=/CSC-Ostwald-Projet-2026-25.06/` avant
  // `vite build`. Garde un seul build paramétrable au lieu de figer le
  // sous-chemin (qui casserait les assets sur Vercel/dev).
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  // ── Dev server ─────────────────────────────────────────────
  // Proxy `/api/*` to the backend so the frontend keeps its relative
  // `apiPost('/newsletter')` calls (no CORS in dev, no env-specific
  // base URL to manage). The backend listens on 3001 by default; the
  // value matches `PORT` in api/.env.example.
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      // Admin image uploads are saved by the API under api/uploads/ and
      // served at /uploads/* by Express. Proxying here keeps URLs
      // same-origin for the SPA so <img src="/uploads/abc.webp"> works
      // without a custom resolver in dev.
      '/uploads': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
    },
  },
  // Sass `loadPaths` lets every .scss `@use 'variables'` resolve to
  // src/styles/_variables.scss regardless of where the consumer .scss
  // file lives (page co-located, section under pages/Accueil/sections,
  // etc.). Without this, every move of a .scss file would require
  // updating its @use paths.
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
      },
    },
  },
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
  build: {
    // Source maps disabled in production — they would ship the full JS
    // source (and indirectly hint at backend endpoints, routes, etc.) to
    // any visitor's DevTools. Local debugging uses `vite preview` which
    // can read maps from the dev cache.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Vite 8 (Rolldown) n'accepte plus `manualChunks` sous forme d'objet,
        // uniquement sous forme de fonction. L'ordre des `if` est important :
        // les paquets spécifiques (react-icons, react-leaflet, react-i18next,
        // react-helmet-async) doivent matcher AVANT le filet générique React.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-icons')) return 'icons';
          if (id.includes('react-leaflet') || id.includes('leaflet')) return 'leaflet';
          if (id.includes('react-helmet-async')) return 'helmet';
          if (id.includes('react-i18next') || id.includes('i18next')) return 'i18n';
          if (id.includes('react-router')) return 'vendor';
          if (id.includes('react-dom') || /[\\/]react[\\/]/.test(id)) return 'vendor';
        },
      },
    },
  },
});
