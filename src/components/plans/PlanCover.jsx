import { useState } from 'react'
import { coverSources } from '../../lib/covers.js'
import { SUPABASE_URL } from '../../lib/supabase.js'
import styles from './PlanCover.module.css'

// Ancho aproximado que ocupa la imagen en cada layout, para que el navegador elija la versión del srcSet
const SIZES = {
  card: '(min-width: 1440px) 24vw, (min-width: 1024px) 42vw, (min-width: 640px) 50vw, 100vw',
  hero: '(min-width: 1024px) 400px, (min-width: 720px) 560px, 100vw',
}

/** Portada 16:9. Si la imagen no carga, desaparece en lugar de dejar un hueco roto. */
export default function PlanCover({ url, variant = 'card' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const [loadedUrl, setLoadedUrl] = useState(null)
  if (!url || failedUrl === url) return null
  const { src, srcSet } = coverSources(url, SUPABASE_URL)
  return (
    <div className={styles[variant]} data-cover>
      {/* loading y sizes antes que src: React aplica los atributos en orden */}
      <img
        className={styles.img}
        loading={variant === 'card' ? 'lazy' : 'eager'}
        decoding="async"
        referrerPolicy="no-referrer"
        sizes={srcSet ? SIZES[variant] : undefined}
        srcSet={srcSet}
        src={src}
        alt=""
        data-loaded={loadedUrl === url || undefined}
        onLoad={() => setLoadedUrl(url)}
        onError={() => setFailedUrl(url)}
      />
    </div>
  )
}
