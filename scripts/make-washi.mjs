// Genera la textura de papel washi (public/textures/washi-{dark,light}.png).
// PNG de 2 bits con paleta: 4 niveles de transparencia, sin dependencias y por debajo de 10 KB.
// Uso: node scripts/make-washi.mjs   (determinista: siempre produce el mismo archivo)
import { writeFileSync, mkdirSync } from 'node:fs'
import { deflateSync, crc32 } from 'node:zlib'

const SIZE = 160
// Generador pseudoaleatorio con semilla, para que el resultado sea reproducible
let seed = 0x5eed1e
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)

function texture() {
  const px = new Uint8Array(SIZE * SIZE)
  // Grano fino: la mayoría transparente, algunos puntos tenues
  for (let i = 0; i < px.length; i++) {
    const r = rand()
    px[i] = r < 0.72 ? 0 : r < 0.94 ? 1 : r < 0.993 ? 2 : 3
  }
  // Fibras: trazos cortos y curvados, como las del papel de morera
  for (let f = 0; f < 46; f++) {
    let x = rand() * SIZE
    let y = rand() * SIZE
    let angle = rand() * Math.PI * 2
    const length = 6 + rand() * 18
    const level = rand() < 0.3 ? 3 : 2
    for (let s = 0; s < length; s++) {
      px[((Math.round(y) + SIZE) % SIZE) * SIZE + ((Math.round(x) + SIZE) % SIZE)] = level
      angle += (rand() - 0.5) * 0.5
      x += Math.cos(angle)
      y += Math.sin(angle)
    }
  }
  return px
}

function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'ascii')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length)
  return out
}

function png(pixels, rgb, alphas) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(SIZE, 0)
  header.writeUInt32BE(SIZE, 4)
  header.set([2, 3, 0, 0, 0], 8) // 2 bits, color indexado
  const rowBytes = SIZE / 4
  const raw = Buffer.alloc((rowBytes + 1) * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      raw[y * (rowBytes + 1) + 1 + (x >> 2)] |= pixels[y * SIZE + x] << (6 - 2 * (x & 3))
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('PLTE', Buffer.from(Array(4).fill(rgb).flat())),
    chunk('tRNS', Buffer.from(alphas)),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const pixels = texture()
mkdirSync('public/textures', { recursive: true })
// Oscuro: motas claras sobre tinta. Claro: motas de tinta sobre papel.
const files = {
  'washi-dark.png': png(pixels, [235, 229, 214], [0, 5, 11, 20]),
  'washi-light.png': png(pixels, [90, 70, 40], [0, 7, 14, 26]),
}
for (const [name, data] of Object.entries(files)) {
  writeFileSync(`public/textures/${name}`, data)
  console.log(`public/textures/${name}: ${(data.length / 1024).toFixed(1)} KB`)
}
