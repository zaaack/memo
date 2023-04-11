import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),
    VitePWA({ registerType: 'autoUpdate' })
  ],
  base: './',
  build: {
    outDir: './docs',
  },
  worker: {
    format: 'iife',
  },
  define: {
    'process.env.JGY_USER': JSON.stringify(process.env.JGY_USER),
    'process.env.JGY_PASS': JSON.stringify(process.env.JGY_PASS),
  }
})
