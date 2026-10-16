import { useEffect, useId, useReducer, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/motion.js'
import Icon from './Icon.jsx'
import styles from './Sheet.module.css'

const DISMISS_DISTANCE = 110 // px arrastrados hacia abajo para cerrar
const DISMISS_VELOCITY = 0.6 // o un gesto rápido (px/ms)

/**
 * Modal nativo (<dialog>): bottom sheet en móvil y diálogo centrado en pantallas anchas.
 * El <dialog> da gratis la trampa de foco, Esc y la capa superior.
 * - Se cierra con animación (el contenido se mantiene mientras sale).
 * - En móvil se puede cerrar arrastrando la cabecera hacia abajo.
 * variant="confirm" lo hace pequeño y centrado también en móvil.
 */
export default function Sheet({ open, onClose, title, children, footer, variant = 'sheet' }) {
  const ref = useRef(null)
  const panelRef = useRef(null)
  const titleId = useId()
  const [closing, setClosing] = useState(false)
  const [, rerender] = useReducer((n) => n + 1, 0)
  const drag = useRef(null)

  // Lo último que se mostró, para que no se vacíe durante la animación de salida
  const last = useRef({ title, children, footer })
  if (open) last.current = { title, children, footer }
  const shown = open ? { title, children, footer } : last.current
  // Mientras el <dialog> siga abierto (saliendo), su contenido se mantiene montado
  const visible = open || closing || Boolean(ref.current?.open)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open) {
      setClosing(false)
      if (!dialog.open) {
        dialog.showModal()
        document.documentElement.dataset.modal = ''
        // El <dialog> enfocaría el primer botón (✕). Mejor el campo marcado o, si no hay, el panel.
        const target = dialog.querySelector('[data-autofocus]') ?? panelRef.current
        target?.focus({ preventScroll: true })
      }
      return
    }
    if (!dialog.open) return
    if (prefersReducedMotion()) {
      dialog.close()
      if (!document.querySelector('dialog[open]')) delete document.documentElement.dataset.modal
      rerender()
      return
    }
    setClosing(true)
    const finish = () => {
      dialog.close()
      if (!document.querySelector('dialog[open]')) delete document.documentElement.dataset.modal
      setClosing(false)
      rerender()
      if (panelRef.current) panelRef.current.style.removeProperty('--drag-y')
    }
    // Red de seguridad por si animationend no llega (pestaña en segundo plano, etc.)
    const timer = setTimeout(finish, 450)
    const onEnd = (event) => {
      if (event.target !== panelRef.current) return
      clearTimeout(timer)
      finish()
    }
    panelRef.current?.addEventListener('animationend', onEnd)
    return () => {
      clearTimeout(timer)
      panelRef.current?.removeEventListener('animationend', onEnd)
    }
  }, [open])

  // Si el componente desaparece con la hoja abierta, no dejamos la página sin scroll
  useEffect(
    () => () => {
      if (!document.querySelector('dialog[open]')) delete document.documentElement.dataset.modal
    },
    [],
  )

  // ───── Arrastrar para cerrar (solo la cabecera, solo en modo hoja) ─────
  const onPointerDown = (event) => {
    if (variant !== 'sheet' || event.pointerType === 'mouse' || event.target.closest('button')) return
    if (window.matchMedia('(min-width: 720px)').matches) return
    drag.current = { startY: event.clientY, startT: event.timeStamp, dy: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    panelRef.current.dataset.dragging = ''
  }
  const onPointerMove = (event) => {
    if (!drag.current) return
    const dy = Math.max(0, event.clientY - drag.current.startY)
    drag.current.dy = dy
    panelRef.current.style.setProperty('--drag-y', `${dy}px`)
  }
  const onPointerUp = (event) => {
    if (!drag.current) return
    const { dy, startT } = drag.current
    drag.current = null
    delete panelRef.current.dataset.dragging
    const velocity = dy / Math.max(1, event.timeStamp - startT)
    if (dy > DISMISS_DISTANCE || (dy > 30 && velocity > DISMISS_VELOCITY)) onClose()
    else panelRef.current.style.removeProperty('--drag-y')
  }

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      data-variant={variant}
      data-closing={closing || undefined}
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
      <div className={styles.panel} ref={panelRef} tabIndex={-1}>
        <header
          className={styles.header}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {variant === 'sheet' && <span className={styles.grabber} aria-hidden="true" />}
          <h2 id={titleId} className={styles.title}>{shown.title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </header>
        <div className={styles.body}>{visible && shown.children}</div>
        {shown.footer && visible && <footer className={styles.footer}>{shown.footer}</footer>}
      </div>
    </dialog>
  )
}
