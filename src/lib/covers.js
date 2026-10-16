// Portadas: tamaños, nombres de archivo y URLs de Supabase Storage. Sin dependencias del navegador.

export const COVER_BUCKET = 'covers'

/** Ancho máximo de cada versión. La grande es para el detalle; la pequeña, para las tarjetas. */
export const COVER_WIDTHS = { large: 1600, small: 800 }

/** Límite del bucket (1 MB): por encima, se vuelve a comprimir con menos calidad. */
export const COVER_MAX_BYTES = 1024 * 1024

/**
 * Recorte y escala para `drawImage`: como mucho `targetWidth` de ancho (sin agrandar),
 * y como mucho tan alto como ancho. Las fotos verticales se recortan por el centro,
 * que es la parte que se ve en la banda 16:9.
 */
export function coverGeometry(srcWidth, srcHeight, targetWidth) {
  const scale = Math.min(1, targetWidth / srcWidth)
  const width = Math.round(srcWidth * scale)
  const height = Math.min(Math.round(srcHeight * scale), width)
  const sh = Math.round(height / scale)
  return { sx: 0, sy: Math.round((srcHeight - sh) / 2), sw: srcWidth, sh, width, height }
}

export function newCoverId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // randomUUID solo existe en contextos seguros (no en http://192.168.x.x durante el desarrollo)
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

export const coverPaths = (id, ext) => ({ large: `${id}.${ext}`, small: `${id}-sm.${ext}` })

export const coverPublicUrl = (baseUrl, path) => `${baseUrl}/storage/v1/object/public/${COVER_BUCKET}/${path}`

/** Rutas [grande, pequeña] si la URL es una portada subida por la app; null si es un enlace externo. */
export function ownCoverPaths(url, baseUrl) {
  const prefix = coverPublicUrl(baseUrl, '')
  if (!url || !baseUrl || !url.startsWith(prefix)) return null
  const match = url.slice(prefix.length).match(/^([a-z0-9-]+)\.(webp|jpg)$/)
  if (!match || match[1].endsWith('-sm')) return null
  return [`${match[1]}.${match[2]}`, `${match[1]}-sm.${match[2]}`]
}

/** `src` y `srcSet` para <img>: con las portadas propias, el navegador elige la versión pequeña si le basta. */
export function coverSources(url, baseUrl) {
  const paths = ownCoverPaths(url, baseUrl)
  if (!paths) return { src: url, srcSet: undefined }
  return {
    src: url,
    srcSet: `${coverPublicUrl(baseUrl, paths[1])} ${COVER_WIDTHS.small}w, ${url} ${COVER_WIDTHS.large}w`,
  }
}
