/**
 * ICU Consent App — Vite Configuration  (Phase 7)
 * ================================================
 * Build tool: Vite 5.x
 * React plugin: @vitejs/plugin-react
 * PWA: Manual service worker (not vite-plugin-pwa) so we have
 *      full control over caching strategy and update lifecycle.
 *
 * Install dependencies:
 *   npm install vite @vitejs/plugin-react
 *
 * Scripts (add to package.json):
 *   "dev"     : "vite",
 *   "build"   : "vite build",
 *   "preview" : "vite preview"
 *
 * Deploy:
 *   npm run build → dist/
 *   Upload dist/ to Firebase Hosting or Vercel (free tier)
 *   Set dist/ as the public directory
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],

  // ── Build output ──────────────────────────────────────────────────────────
  build: {
    outDir: "dist",
    sourcemap: false,        // No sourcemaps in production (patient data security)
    minify: "terser",

    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
      },
      output: {
        // Deterministic chunk names for cache busting
        entryFileNames: "static/js/main.js",
        chunkFileNames: "static/js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) return "static/css/main.css";
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name || ""))
            return "static/img/[name]-[hash][extname]";
          return "static/assets/[name]-[hash][extname]";
        },
      },
    },

    // Target modern browsers (no IE11) — ICU devices run Chrome
    target: ["chrome90", "firefox88", "safari14"],
  },

  // ── Dev server ────────────────────────────────────────────────────────────
  server: {
    port: 3000,
    open: true,
    // Proxy API calls to Python backend in development
    proxy: {
      "/api": {
        target: "https://icu-consent-app.onrender.com",
        changeOrigin: true,
        // Python Flask dev server runs on 5000
      },
    },
  },

  // ── Service Worker — copy to dist root ───────────────────────────────────
  // Vite doesn't copy arbitrary files, so we use the publicDir mechanism.
  // Place service-worker.js, sw-register.js, manifest.json, and icons/
  // in the /public folder. Vite copies public/ to dist/ as-is.
  publicDir: "public",

  // ── Resolve aliases ───────────────────────────────────────────────────────
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },

  // ── Environment variables ─────────────────────────────────────────────────
  // Access via import.meta.env.VITE_*
  // VITE_API_URL=http://localhost:5000  (dev)
  // VITE_API_URL=https://api.yourhospital.in  (prod)
  define: {
    __APP_VERSION__: JSON.stringify("1.0.0"),
    __CONTENT_DB_VERSION__: JSON.stringify("1.0.0"),
  },
});
