import { useEffect, useId, useRef } from 'react'
import Icon from './Icon.jsx'
import styles from './Sheet.module.css'

/**
 * Modal nativo (<dialog>): bottom sheet en móvil y diálogo centrado en pantallas anchas.
 * El <dialog> da gratis la trampa de foco, Esc y la capa superior.
 * variant="confirm" lo hace pequeño y centrado también en móvil.
 */
export default function Sheet({ open, onClose, title, children, footer, variant = 'sheet' }) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-variant={variant}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // Clic en el fondo (fuera del panel)
        if (event.target === ref.current) onClose()
      }}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          {variant === 'sheet' && <span className={styles.grabber} aria-hidden="true" />}
          <h2 id={titleId} className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.body}>{open && children}</div>
        {footer && open && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </dialog>
  )
}
