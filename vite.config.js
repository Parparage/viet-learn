import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['viet.svg'],
      manifest: {
        name: 'VietLearn — Apprendre le Vietnamien',
        short_name: 'VietLearn',
        description: "Application d'apprentissage du Vietnamien du Nord",
        theme_color: '#dc2626',
        background_color: '#fafafa',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'fr',
        icons: [
          {
            src: 'viet.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg}']
      }
    })
  ]
})
