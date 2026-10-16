// Coordenadas a partir de los enlaces de Google Maps del campo "Dirección".
// También lo usa la función /api/geocode, así que no puede depender del navegador.

const NUM = '(-?\\d{1,3}(?:\\.\\d+)?)'
const PLACE = new RegExp(`!3d${NUM}!4d${NUM}`) // el sitio exacto (enlaces /maps/place/…)
const VIEWPORT = new RegExp(`@${NUM},${NUM}`) // el centro de la vista
const PAIR = new RegExp(`^\\s*${NUM}\\s*,\\s*${NUM}\\s*$`)
const COORD_PARAMS = ['q', 'query', 'll', 'center', 'destination', 'daddr', 'sll']
const NAME_PARAMS = ['q', 'query', 'destination', 'daddr']

function parse(text) {
  try {
    const url = new URL(String(text ?? '').trim())
    return /^https?:$/.test(url.protocol) ? url : null
  } catch {
    return null
  }
}

const valid = (lat, lng) => Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
const point = (match) => {
  if (!match) return null
  const lat = Number(match[1])
  const lng = Number(match[2])
  return valid(lat, lng) ? { lat, lng } : null
}

/** Enlaces cortos de "Compartir" (maps.app.goo.gl, goo.gl/maps): hay que seguir la redirección. */
export function isShortMapsUrl(text) {
  const url = parse(text)
  if (!url) return false
  const host = url.hostname.toLowerCase()
  return host === 'maps.app.goo.gl' || (host === 'goo.gl' && url.pathname.startsWith('/maps'))
}

export function isGoogleMapsUrl(text) {
  const url = parse(text)
  if (!url) return false
  const host = url.hostname.toLowerCase()
  if (isShortMapsUrl(text) || /^maps\.google\.[a-z.]+$/.test(host)) return true
  return /^(www\.)?google\.[a-z.]+$/.test(host) && url.pathname.startsWith('/maps')
}

/** { lat, lng } si el enlace lleva las coordenadas; null si no (o si no es un enlace). */
export function coordsFromMapsUrl(text) {
  const url = parse(text)
  if (!url) return null
  let decoded = url.href
  try {
    decoded = decodeURIComponent(url.href)
  } catch {
    // Enlace con % sueltos: se busca en el texto tal cual
  }
  const place = point(decoded.match(PLACE))
  if (place) return place
  for (const key of COORD_PARAMS) {
    const found = point(url.searchParams.get(key)?.match(PAIR))
    if (found) return found
  }
  return point(decoded.match(VIEWPORT))
}

/** Nombre del sitio cuando el enlace no trae coordenadas (?q=Fushimi+Inari, /maps/place/Kinkaku-ji/…). */
export function placeNameFromMapsUrl(text) {
  const url = parse(text)
  if (!url) return null
  for (const key of NAME_PARAMS) {
    const value = url.searchParams.get(key)?.trim()
    if (value && !PAIR.test(value)) return value
  }
  const segment = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/)?.[1]
  if (!segment) return null
  try {
    return decodeURIComponent(segment.replace(/\+/g, ' ')).trim() || null
  } catch {
    return null
  }
}

export const RETRY_MISS_MS = 7 * 24 * 3600 * 1000 // un enlace que no se pudo situar se reintenta a la semana

/**
 * Reparte los planes para el mapa. `cache`: { [enlace]: { lat, lng } | { miss: timestamp } }.
 * - points: los que se pueden dibujar ya.
 * - toResolve: enlaces que hay que preguntar a /api/geocode.
 * - unresolved: tienen enlace, pero no se pudo situar.
 * - withoutLink: sin enlace de Google Maps (vacío o una dirección escrita).
 */
export function locatePlans(plans, cache, now = Date.now()) {
  const points = []
  const toResolve = new Set()
  const unresolved = []
  const withoutLink = []
  for (const plan of plans) {
    const link = plan.location?.trim()
    if (!link || !isGoogleMapsUrl(link)) {
      withoutLink.push(plan)
      continue
    }
    const coords = coordsFromMapsUrl(link) ?? cache[link]
    if (coords?.lat != null) points.push({ plan, lat: coords.lat, lng: coords.lng })
    else if (coords?.miss && now - coords.miss < RETRY_MISS_MS) unresolved.push(plan)
    else toResolve.add(link)
  }
  return { points, toResolve: [...toResolve], unresolved, withoutLink }
}
