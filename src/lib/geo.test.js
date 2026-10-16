import { describe, expect, it } from 'vitest'
import { coordsFromMapsUrl, isGoogleMapsUrl, isShortMapsUrl, locatePlans, placeNameFromMapsUrl, RETRY_MISS_MS } from './geo.js'

const PLACE_URL =
  'https://www.google.com/maps/place/Fushimi+Inari+Taisha/@34.9676945,135.7791876,17z/data=!3m1!4b1!4m6!3m5!1s0x60010f153d2e6d21:0x7b1aca1c753ae2e9!8m2!3d34.9676945!4d135.7726585!16zL20vMDJ5NGI0'

describe('isGoogleMapsUrl / isShortMapsUrl', () => {
  it('reconoce los enlaces de Google Maps', () => {
    expect(isGoogleMapsUrl(PLACE_URL)).toBe(true)
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/AbCdEf123')).toBe(true)
    expect(isGoogleMapsUrl('https://goo.gl/maps/xyz')).toBe(true)
    expect(isGoogleMapsUrl('https://maps.google.com/?q=Fushimi+Inari+Taisha')).toBe(true)
    expect(isGoogleMapsUrl('https://www.google.co.jp/maps/@35.6,139.7,15z')).toBe(true)
  })
  it('descarta lo demás', () => {
    expect(isGoogleMapsUrl('Dotonbori, Osaka')).toBe(false)
    expect(isGoogleMapsUrl('https://www.google.com/search?q=ramen')).toBe(false)
    expect(isGoogleMapsUrl('https://goo.gl/abc')).toBe(false)
    expect(isGoogleMapsUrl('https://example.com/maps/place/x')).toBe(false)
    expect(isGoogleMapsUrl('')).toBe(false)
  })
  it('distingue los enlaces cortos', () => {
    expect(isShortMapsUrl('https://maps.app.goo.gl/AbCdEf123')).toBe(true)
    expect(isShortMapsUrl(PLACE_URL)).toBe(false)
  })
})

describe('coordsFromMapsUrl', () => {
  it('prefiere el sitio exacto (!3d!4d) al centro de la vista', () => {
    expect(coordsFromMapsUrl(PLACE_URL)).toEqual({ lat: 34.9676945, lng: 135.7726585 })
  })
  it('usa el centro de la vista (@lat,lng)', () => {
    expect(coordsFromMapsUrl('https://www.google.com/maps/@35.6595,139.7005,17z')).toEqual({ lat: 35.6595, lng: 139.7005 })
  })
  it('lee coordenadas en los parámetros', () => {
    expect(coordsFromMapsUrl('https://maps.google.com/?q=35.0116,135.7681')).toEqual({ lat: 35.0116, lng: 135.7681 })
    expect(coordsFromMapsUrl('https://www.google.com/maps/search/?api=1&query=34.6687%2C135.5013')).toEqual({ lat: 34.6687, lng: 135.5013 })
    expect(coordsFromMapsUrl('https://www.google.com/maps/dir/?api=1&destination=35.49,138.80')).toEqual({ lat: 35.49, lng: 138.8 })
  })
  it('null si no hay coordenadas o son imposibles', () => {
    expect(coordsFromMapsUrl('https://maps.google.com/?q=Fushimi+Inari+Taisha')).toBeNull()
    expect(coordsFromMapsUrl('https://maps.app.goo.gl/AbCdEf123')).toBeNull()
    expect(coordsFromMapsUrl('https://www.google.com/maps/@135.1,35.2,15z')).toBeNull()
    expect(coordsFromMapsUrl('no es un enlace')).toBeNull()
  })
})

describe('placeNameFromMapsUrl', () => {
  it('saca el nombre del parámetro o de la ruta', () => {
    expect(placeNameFromMapsUrl('https://maps.google.com/?q=Fushimi+Inari+Taisha')).toBe('Fushimi Inari Taisha')
    expect(placeNameFromMapsUrl('https://www.google.com/maps/place/Kinkaku-ji/data=!4m2')).toBe('Kinkaku-ji')
    expect(placeNameFromMapsUrl('https://www.google.com/maps/search/teamLab+Planets+%E8%B1%8A%E6%B4%B2')).toBe('teamLab Planets 豊洲')
  })
  it('null si solo hay coordenadas o nada', () => {
    expect(placeNameFromMapsUrl('https://maps.google.com/?q=35.0,135.7')).toBeNull()
    expect(placeNameFromMapsUrl('https://www.google.com/maps/@35.6,139.7,15z')).toBeNull()
  })
})

describe('locatePlans', () => {
  const plan = (id, location) => ({ id, location })
  const SHORT = 'https://maps.app.goo.gl/AbCdEf123'
  const NAMED = 'https://maps.google.com/?q=Fushimi+Inari+Taisha'

  it('reparte entre dibujables, por resolver, sin situar y sin enlace', () => {
    const now = 1_000_000_000
    const result = locatePlans(
      [
        plan('a', PLACE_URL),
        plan('b', SHORT),
        plan('c', NAMED),
        plan('d', 'Dotonbori, Osaka'),
        plan('e', null),
        plan('f', SHORT), // mismo enlace: se pide una sola vez
      ],
      { [NAMED]: { miss: now - 1000 } },
      now,
    )
    expect(result.points.map((p) => p.plan.id)).toEqual(['a'])
    expect(result.toResolve).toEqual([SHORT])
    expect(result.unresolved.map((p) => p.id)).toEqual(['c'])
    expect(result.withoutLink.map((p) => p.id)).toEqual(['d', 'e'])
  })

  it('usa la caché y reintenta los fallos antiguos', () => {
    const now = 1_000_000_000
    const result = locatePlans(
      [plan('b', SHORT), plan('c', NAMED)],
      { [SHORT]: { lat: 35, lng: 139 }, [NAMED]: { miss: now - RETRY_MISS_MS - 1 } },
      now,
    )
    expect(result.points).toEqual([{ plan: plan('b', SHORT), lat: 35, lng: 139 }])
    expect(result.toResolve).toEqual([NAMED])
  })
})
