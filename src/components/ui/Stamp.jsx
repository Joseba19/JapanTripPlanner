import { useEffect, useRef, useState } from 'react'
import { STATUS_BY_ID } from '../../lib/constants.js'
import styles from './Stamp.module.css'

/**
 * Estado del plan como sello hanko. "Idea" es un sello tenue; "confirmado" un sello bermellón;
 * "hecho" un sello verde tachado con un trazo de pincel.
 * Cuando el estado cambia (también por tiempo real), el sello se estampa con una animación;
 * al montarse no se anima, para no llenar la lista de movimiento.
 */
export default function Stamp({ status, size = 'sm' }) {
  const info = STATUS_BY_ID[status] ?? STATUS_BY_ID.idea
  const previous = useRef(status)
  const [pressCount, setPressCount] = useState(0)

  useEffect(() => {
    if (previous.current === status) return
    previous.current = status
    if (status !== 'idea') setPressCount((n) => n + 1)
  }, [status])

  return (
    <span className={styles.stamp} data-status={info.id} data-size={size}>
      {/* La key reinicia la animación en cada cambio */}
      <span key={pressCount} className={styles.seal} data-pressed={pressCount > 0 || undefined} aria-hidden="true">
        <span className="kanji">{info.kanji}</span>
      </span>
      <span className={styles.label}>{info.label}</span>
    </span>
  )
}
