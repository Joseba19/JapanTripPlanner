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
            // Estilo e índice de mosaicos de OpenFreeMap: de la red si hay (cambian cada semana y las versiones
            // viejas desaparecen); sin conexión, la última copia
            urlPattern: ({ url }) =>
              url.hostname === 'tiles.openfreemap.org' && (url.pathname.startsWith('/styles/') || url.pathname === '/planet'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'map-style',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 10 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Mosaicos, fuentes y sprites (llevan versión en la URL): los ya vistos sirven sin conexión
            urlPattern: ({ url }) => url.hostname === 'tiles.openfreemap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 1000, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Portadas (Supabase Storage o URL pegada): se guardan las que ya se han visto
            urlPattern: ({ request, sameOrigin }) => request.destination === 'image' && !sameOrigin,
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
  build: {
    // MapLibre (el chunk del mapa) ocupa ~1 MB sin comprimir (~285 KB comprimido); solo se descarga al abrir el mapa
    chunkSizeWarningLimit: 1100,
  },
  server: {
    // Accesible desde el móvil en la misma wifi con `npm run dev -- --host`
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
