import styles from './Chip.module.css'

/** Botón de filtro o selección. `selected` → aria-pressed. `color` tiñe el punto y el borde activo. */
export default function Chip({ selected = false, color, kanji, count, onClick, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${className}`}
      aria-pressed={selected}
      onClick={onClick}
      style={color ? { '--chip-color': color } : undefined}
      {...props}
    >
      {kanji ? <span className={`${styles.kanji} kanji`} aria-hidden="true">{kanji}</span> : color && <span className={styles.dot} aria-hidden="true" />}
      <span>{children}</span>
      {count != null && <span className={styles.count}>{count}</span>}
    </button>
  )
}
