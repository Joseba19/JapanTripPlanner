import { useEffect, useId, useReducer, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import styles from './Sheet.module.css'

const DISMISS_DISTANCE = 110 // px arrastrados hacia abajo para cerrar
const DISMISS_VELOCITY = 0.11 // …o un gesto rápido (px/ms): basta con un golpe de dedo
const EXIT_FALLBACK = 500 // ms; por si transitionend no llega (pestaña en segundo plano, etc.)

/**
 * Modal nativo (<dialog>): bottom sheet en móvil y diálogo centrado en pantallas anchas.
 * El <dialog> da gratis la trampa de foco, Esc y la capa superior.
 * - Entra y sale por el mismo camino con transiciones (no keyframes): si se reabre mientras sale,
 *   da la vuelta desde donde está en vez de empezar de cero. El contenido se mantiene mientras sale.
 *   `data-shown` en el <dialog> es el estado final; sin él, el estado de entrada/salida.
 * - En móvil se puede cerrar arrastrando la cabecera hacia abajo (o con un golpe rápido).
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
    const panel = panelRef.current
    if (open) {
      setClosing(false)
      if (!dialog.open) {
        dialog.showModal()
        document.documentElement.dataset.modal = ''
        // El <dialog> enfocaría el primer botón (✕). Mejor el campo marcado o, si no hay, el panel.
        const target = dialog.querySelector('[data-autofocus]') ?? panel
        target?.focus({ preventScroll: true })
        // Fija el estado de entrada (fuera de pantalla) antes de pasar al final: así hay transición
        dialog.getBoundingClientRect()
      }
      dialog.dataset.shown = ''
      return
    }
    if (!dialog.open) return
    setClosing(true)
    delete dialog.dataset.shown
    const finish = () => {
      dialog.close()
      if (!document.querySelector('dialog[open]')) delete document.documentElement.dataset.modal
      setClosing(false)
      rerender()
    }
    const timer = setTimeout(finish, EXIT_FALLBACK)
    const onEnd = (event) => {
      if (event.target !== panel || (event.propertyName !== 'transform' && event.propertyName !== 'opacity')) return
      clearTimeout(timer)
      finish()
    }
    panel?.addEventListener('transitionend', onEnd)
    return () => {
      clearTimeout(timer)
      panel?.removeEventListener('transitionend', onEnd)
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
  // El transform se pone en el propio panel: con una variable CSS se recalcularían los estilos de todo su contenido.
  const onPointerDown = (event) => {
    // Un segundo dedo durante el arrastre se ignora (si no, la hoja saltaría a su posición)
    if (drag.current || variant !== 'sheet' || event.pointerType === 'mouse' || event.target.closest('button')) return
    if (window.matchMedia('(min-width: 720px)').matches) return
    drag.current = { pointerId: event.pointerId, startY: event.clientY, startT: event.timeStamp, dy: 0 }
    event.currentTarget.setPointerCapture(event.pointerId)
    panelRef.current.dataset.dragging = ''
  }
  const onPointerMove = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return
    const dy = event.clientY - drag.current.startY
    drag.current.dy = dy
    // Hacia arriba no hay tope en seco: cede cada vez menos, como algo que se frena
    const offset = dy >= 0 ? dy : -8 * Math.log1p(-dy)
    panelRef.current.style.transform = `translateY(${offset}px)`
  }
  const onPointerUp = (event) => {
    if (drag.current?.pointerId !== event.pointerId) return
    const { dy, startT } = drag.current
    drag.current = null
    const panel = panelRef.current
    delete panel.dataset.dragging
    // Sin el transform del dedo, la transición lleva la hoja desde donde está a su sitio (o fuera, si se cierra)
    panel.style.removeProperty('transform')
    const velocity = dy / Math.max(1, event.timeStamp - startT)
    if (dy > DISMISS_DISTANCE || (dy > 30 && velocity > DISMISS_VELOCITY)) onClose()
  }

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
