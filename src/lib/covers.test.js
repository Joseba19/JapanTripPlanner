import { describe, expect, it } from 'vitest'
import { coverGeometry, coverPaths, coverPublicUrl, coverSources, newCoverId, ownCoverPaths } from './covers.js'

const BASE = 'https://abc.supabase.co'
const own = `${BASE}/storage/v1/object/public/covers/1f3a-77.webp`

describe('coverGeometry', () => {
  it('reduce una foto horizontal sin recortar', () => {
    expect(coverGeometry(4032, 3024, 1600)).toEqual({ sx: 0, sy: 0, sw: 4032, sh: 3024, width: 1600, height: 1200 })
  })
  it('recorta una foto vertical por el centro hasta dejarla cuadrada', () => {
    const g = coverGeometry(3024, 4032, 800)
    expect([g.width, g.height]).toEqual([800, 800])
    expect(g.sh).toBe(3024)
    expect(g.sy).toBe(504)
  })
  it('no agranda imágenes pequeñas', () => {
    expect(coverGeometry(640, 360, 1600)).toMatchObject({ width: 640, height: 360, sy: 0 })
  })
})

describe('rutas y URLs', () => {
  it('nombres de las dos versiones', () => {
    expect(coverPaths('abc', 'webp')).toEqual({ large: 'abc.webp', small: 'abc-sm.webp' })
  })
  it('los ids cumplen el patrón que exige la política de Storage', () => {
    for (let i = 0; i < 20; i++) expect(`${newCoverId()}-sm.webp`).toMatch(/^[a-z0-9-]+\.(webp|jpg)$/)
  })
  it('reconoce solo las portadas propias', () => {
    expect(ownCoverPaths(own, BASE)).toEqual(['1f3a-77.webp', '1f3a-77-sm.webp'])
    expect(ownCoverPaths(`${BASE}/storage/v1/object/public/covers/x-sm.webp`, BASE)).toBeNull()
    expect(ownCoverPaths('https://upload.wikimedia.org/foto.jpg', BASE)).toBeNull()
    expect(ownCoverPaths(`${BASE}/storage/v1/object/public/otro/x.webp`, BASE)).toBeNull()
    expect(ownCoverPaths(null, BASE)).toBeNull()
  })
  it('srcSet solo para las portadas propias', () => {
    expect(coverSources(own, BASE)).toEqual({
      src: own,
      srcSet: `${coverPublicUrl(BASE, '1f3a-77-sm.webp')} 800w, ${own} 1600w`,
    })
    expect(coverSources('https://example.com/a.jpg', BASE)).toEqual({ src: 'https://example.com/a.jpg', srcSet: undefined })
  })
})
