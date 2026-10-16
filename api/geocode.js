// Coordenadas de un enlace de Google Maps que no las lleva a la vista.
// GET /api/geocode?url=<enlace> → { lat, lng, source } o { lat: null } si no se pudo situar.
//
// 1. Enlaces cortos (maps.app.goo.gl): se sigue la redirección hasta el enlace largo, que suele llevar coordenadas.
// 2. Si al final solo hay un nombre (?q=Fushimi+Inari), se busca en OpenStreetMap (Nominatim), dentro de Japón.
// Solo se siguen redirecciones a dominios de Google: no es un proxy abierto.
// Usa la API de Node (no los helpers de Vercel) para que el servidor de desarrollo de Vite la pueda montar igual.

import { coordsFromMapsUrl, isGoogleMapsUrl, placeNameFromMapsUrl } from '../src/lib/geo.js'

const USER_AGENT = 'JapanTripPlanner/1.0 (planificador de viaje entre amigos; https://github.com/Joseba19/JapanTripPlanner)'
const MAX_REDIRECTS = 5
const GOOGLE_HOST = /^(maps\.app\.goo\.gl|goo\.gl|consent\.google\.[a-z.]+|(www\.|maps\.)?google\.[a-z.]+)$/i

function send(res, status, body, cacheControl) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  // La CDN de Vercel guarda la respuesta: cada enlace se resuelve una vez para todos
  res.setHeader('cache-control', cacheControl ?? 'no-store')
  res.end(JSON.stringify(body))
}

/** Sigue las redirecciones (solo de Google) y devuelve el último enlace. */
async function expand(start) {
  let current = start
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    if (coordsFromMapsUrl(current.href)) return current
    const response = await fetch(current, {
      redirect: 'manual',
      headers: { 'user-agent': USER_AGENT, 'accept-language': 'es,en;q=0.8' },
      signal: AbortSignal.timeout(6000),
    })
    const location = response.headers.get('location')
    if (response.status < 300 || response.status >= 400 || !location) return current
    let next = new URL(location, current)
    // Pantalla de cookies de Google (UE): el destino real va en ?continue=
    if (next.hostname.startsWith('consent.')) {
      const target = next.searchParams.get('continue')
      if (!target) return current
      next = new URL(target)
    }
    if (!/^https?:$/.test(next.protocol) || !GOOGLE_HOST.test(next.hostname)) return current
    current = next
  }
  return current
}

async function searchPlace(name) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.search = new URLSearchParams({ q: name, format: 'jsonv2', limit: '1', countrycodes: 'jp' })
  const response = await fetch(url, {
    headers: { 'user-agent': USER_AGENT, 'accept-language': 'ja,en' },
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) throw new Error(`Nominatim respondió ${response.status}`)
  const [first] = await response.json()
  return first ? { lat: Number(first.lat), lng: Number(first.lon) } : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'Solo GET' })
  const input = new URL(req.url, 'http://localhost').searchParams.get('url')?.trim()
  if (!input || input.length > 2000 || !isGoogleMapsUrl(input)) {
    return send(res, 400, { error: 'Hace falta un enlace de Google Maps en ?url=' })
  }

  try {
    const direct = coordsFromMapsUrl(input)
    if (direct) return send(res, 200, { ...direct, source: 'link' }, 'public, max-age=86400, s-maxage=31536000')

    const expanded = await expand(new URL(input))
    const fromLink = coordsFromMapsUrl(expanded.href)
    if (fromLink) return send(res, 200, { ...fromLink, source: 'redirect' }, 'public, max-age=86400, s-maxage=31536000')

    const name = placeNameFromMapsUrl(expanded.href) ?? placeNameFromMapsUrl(input)
    const found = name ? await searchPlace(name) : null
    if (found) return send(res, 200, { ...found, source: 'search', name }, 'public, max-age=86400, s-maxage=31536000')

    // No es un error: el enlace no lleva a ningún sitio reconocible. Se vuelve a probar al día siguiente.
    return send(res, 200, { lat: null, name }, 'public, max-age=3600, s-maxage=86400')
  } catch (error) {
    // Google o Nominatim no respondieron: no se guarda en caché, el cliente lo reintentará
    return send(res, 502, { error: String(error?.message ?? error) })
  }
}
