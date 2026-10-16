import { COVER_MAX_BYTES, COVER_WIDTHS, coverGeometry } from './covers.js'

/** Decodifica respetando la orientación EXIF (las fotos del móvil vienen "tumbadas"). */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() }
    } catch {
      // Algunos Safari no aceptan las opciones: probamos con <img>
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, release: () => {} }
  } finally {
    URL.revokeObjectURL(url)
  }
}

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

async function render(image, targetWidth, type, quality) {
  const g = coverGeometry(image.width, image.height, targetWidth)
  const canvas = document.createElement('canvas')
  canvas.width = g.width
  canvas.height = g.height
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image.source, g.sx, g.sy, g.sw, g.sh, 0, 0, g.width, g.height)
  const blob = await toBlob(canvas, type, quality)
  // iOS libera antes la memoria del canvas si se deja a 0
  canvas.width = 0
  canvas.height = 0
  return blob
}

/** Elige WebP si el navegador sabe crearlo; si no, JPEG. */
async function pickFormat(image) {
  const probe = await render(image, 16, 'image/webp', 0.8)
  return probe?.type === 'image/webp' ? { type: 'image/webp', ext: 'webp' } : { type: 'image/jpeg', ext: 'jpg' }
}

async function encode(image, width, type) {
  for (const quality of [0.8, 0.65, 0.5]) {
    const blob = await render(image, width, type, quality)
    if (!blob) throw new Error('No se pudo procesar la imagen.')
    if (blob.size <= COVER_MAX_BYTES) return blob
  }
  throw new Error('La imagen sigue pesando demasiado. Prueba con otra.')
}

/**
 * Convierte la foto elegida en dos versiones listas para subir:
 * { large, small, ext } con large ≤ 1600 px y small ≤ 800 px de ancho.
 */
export async function compressCover(file) {
  if (!file.type.startsWith('image/')) throw new Error('Ese archivo no es una imagen.')
  let image
  try {
    image = await decode(file)
  } catch {
    throw new Error('Este navegador no puede leer ese formato. Prueba con una foto JPG o PNG.')
  }
  try {
    const { type, ext } = await pickFormat(image)
    const large = await encode(image, COVER_WIDTHS.large, type)
    const small = await encode(image, COVER_WIDTHS.small, type)
    return { large, small, ext }
  } finally {
    image.release()
  }
}
