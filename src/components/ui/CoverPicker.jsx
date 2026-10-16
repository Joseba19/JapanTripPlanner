import { useRef, useState } from 'react'
import { compressCover } from '../../lib/imageCompress.js'
import { coverSources } from '../../lib/covers.js'
import { SUPABASE_URL } from '../../lib/supabase.js'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import styles from './CoverPicker.module.css'

/**
 * Portada del plan: subir una foto (se comprime aquí, se sube al guardar) o pegar un enlace https.
 * - `imageUrl`: enlace guardado o pegado ('' si no hay)
 * - `pending`: foto elegida y ya comprimida, pendiente de subir ({ large, small, ext, previewUrl })
 */
export default function CoverPicker({ imageUrl, pending, onPickFile, onUrlChange, onRemove, id, describedBy, invalid }) {
  const inputRef = useRef(null)
  const [processing, setProcessing] = useState(false)
  const [fileError, setFileError] = useState(null)
  const [brokenUrl, setBrokenUrl] = useState(null)
  const [dragging, setDragging] = useState(false)

  const isOwnUpload = Boolean(coverSources(imageUrl, SUPABASE_URL).srcSet)
  // Solo intentamos cargar enlaces que ya parecen completos, no cada letra mientras se escribe
  const looksComplete = /^https:\/\/[^\s/]+\.[^\s/]+\/\S+/i.test(imageUrl)
  const previewSrc = pending?.previewUrl ?? (looksComplete && !invalid ? imageUrl : null)
  const showUrlInput = !pending && !isOwnUpload

  const handleFile = async (file) => {
    if (!file) return
    setFileError(null)
    setProcessing(true)
    try {
      onPickFile(await compressCover(file))
    } catch (error) {
      setFileError(error.message)
    } finally {
      setProcessing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const choose = () => inputRef.current?.click()

  return (
    <div className={styles.picker}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {previewSrc ? (
        <div className={styles.preview}>
          {brokenUrl === previewSrc ? (
            <div className={styles.broken}>
              <span className="kanji" aria-hidden="true">壊</span>
              No se pudo cargar esta imagen. Revisa que el enlace sea directo a la imagen.
            </div>
          ) : (
            <img src={previewSrc} alt="Vista previa de la portada" onError={() => setBrokenUrl(previewSrc)} />
          )}
          <div className={styles.overlay}>
            <Button size="sm" icon="edit" onClick={choose} loading={processing}>
              {processing ? 'Preparando…' : 'Cambiar foto'}
            </Button>
            <Button size="sm" variant="ghost" icon="trash" onClick={onRemove} className={styles.remove}>
              Quitar
            </Button>
          </div>
          {pending && <span className={styles.badge}>Se subirá al guardar</span>}
        </div>
      ) : (
        <button
          type="button"
          className={styles.drop}
          data-dragging={dragging || undefined}
          onClick={choose}
          disabled={processing}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handleFile(e.dataTransfer.files?.[0])
          }}
        >
          <span className={styles.dropIcon} aria-hidden="true">
            <Icon name={processing ? 'clock' : 'plus'} size={22} />
          </span>
          <span className={styles.dropTitle}>{processing ? 'Preparando la foto…' : 'Subir foto'}</span>
          <span className={styles.dropHint}>Desde la galería, la cámara o el ordenador</span>
        </button>
      )}

      {fileError && (
        <p className={styles.error} role="alert">
          {fileError}
        </p>
      )}

      {showUrlInput && (
        <div className={styles.url}>
          <label className={styles.urlLabel} htmlFor={id}>
            o pega un enlace a una imagen
          </label>
          <input
            id={id}
            className="input"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://…/foto.jpg"
            value={imageUrl}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => onUrlChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}
