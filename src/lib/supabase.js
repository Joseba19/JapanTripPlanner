import { PostgrestClient } from '@supabase/postgrest-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Solo el cliente de la API REST (sin login, archivos ni funciones): el SDK completo pesaba más de 600 kB.
// null si faltan las variables de entorno: la app muestra una pantalla de configuración.
export const db = url && key ? new PostgrestClient(`${url}/rest/v1`, { headers: { apikey: key } }) : null
