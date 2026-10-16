import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En desarrollo, /api/geocode responde igual que en Vercel (la función usa la API de Node a secas)
const devApi = {
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/geocode', async (req, res) => {
      const { default: handler } = await server.ssrLoadModule('/api/geocode.js')
      return handler(req, res)
    })
  },
}

export default defineConfig({
  plugins: [
    react(),
    devApi,
    VitePWA({
      // Avisamos nosotros de la versión nueva (toast "Actualizar"): recargar solos podría cortar una edición
      registerType: 'prompt',
      injectRegister: false,
      // Los iconos solo hacen falta al instalar: no se precachean
      includeManifestIcons: false,
      manifest: {
        name: "旅 · Japón '27",
        short_name: "Japón '27",
        description: 'Los planes del viaje a Japón',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0f1014',
        theme_color: '#0f1014',
        icons: [
          { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // La app entera (JS, CSS, fuentes y texturas) queda precacheada: abre sin conexión.
        // Solo WOFF2 (todos los navegadores actuales); los .woff de @fontsource sobran.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        globIgnores: ['icons/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // Los datos (Supabase REST y Realtime) no pasan por la caché: la instantánea vive en localStorage
        runtimeCaching: [
          {
            // Mosaicos del mapa ya vistos: sin conexión se ve lo que se miró antes. Van con CORS (no opacos).
            // CacheFirst también respeta la política de OSM (guardarlos al menos 7 días en vez de pedirlos otra vez).
            urlPattern: ({ url }) => url.hostname === 'tile.openstreetmap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Portadas (Supabase Storage o URL pegada): se guardan las que ya se han visto
            urlPattern: ({ request, sameOrigin, url }) =>
              request.destination === 'image' && !sameOrigin && url.hostname !== 'tile.openstreetmap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'covers',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // Accesible desde el móvil en la misma wifi con `npm run dev -- --host`
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
