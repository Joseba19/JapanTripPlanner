import { COVER_BUCKET, coverPaths, coverPublicUrl, newCoverId, ownCoverPaths } from '../lib/covers.js'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/supabase.js'

// API REST de Storage con fetch: storage-js añadiría unos 110 kB para dos llamadas.
const endpoint = (path = '') => `${SUPABASE_URL}/storage/v1/object/${COVER_BUCKET}${path && `/${path}`}`

async function upload(path, blob) {
  const response = await fetch(endpoint(path), {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'content-type': blob.type,
      // Los nombres no se reutilizan nunca: se pueden cachear para siempre
      'cache-control': 'max-age=31536000',
    },
    body: blob,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message ? `No se pudo subir la foto: ${body.message}` : `No se pudo subir la foto (${response.status}).`)
  }
}

async function removePaths(paths) {
  const response = await fetch(endpoint(), {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  })
  if (!response.ok) throw new Error(`Storage respondió ${response.status}`)
}

/** Sube las dos versiones y devuelve la URL pública de la grande (la que se guarda en `image_url`). */
export async function uploadCover({ large, small, ext }) {
  const paths = coverPaths(newCoverId(), ext)
  const results = await Promise.allSettled([upload(paths.small, small), upload(paths.large, large)])
  const failed = results.find((r) => r.status === 'rejected')
  if (failed) {
    removePaths([paths.large, paths.small]).catch(() => {})
    throw failed.reason
  }
  return coverPublicUrl(SUPABASE_URL, paths.large)
}

/** Borra una portada subida por la app. Los enlaces externos se ignoran. Nunca lanza: un huérfano no es grave. */
export async function removeCover(url) {
  const paths = ownCoverPaths(url, SUPABASE_URL)
  if (!paths) return
  try {
    await removePaths(paths)
  } catch (error) {
    console.warn('No se pudo borrar la portada', url, error)
  }
}
