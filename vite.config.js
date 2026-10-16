import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Accesible desde el móvil en la misma wifi con `npm run dev -- --host`
    port: 5173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
})
