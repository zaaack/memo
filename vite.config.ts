import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({ registerType: "autoUpdate" })],
  base: "./",
  build: {
    outDir: "./docs",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5111",
        changeOrigin: true,
      },
    },
  },

  worker: {
    format: "iife",
  },
  define: {},
});
