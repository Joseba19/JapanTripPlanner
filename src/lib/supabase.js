import { PostgrestClient } from '@supabase/postgrest-js'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Solo el cliente de la API REST (sin login, archivos ni funciones): el SDK completo pesaba más de 600 kB.
// null si faltan las variables de entorno: la app muestra una pantalla de configuración.
export const db =
  SUPABASE_URL && SUPABASE_KEY
    ? new PostgrestClient(`${SUPABASE_URL}/rest/v1`, { headers: { apikey: SUPABASE_KEY } })
    : null
