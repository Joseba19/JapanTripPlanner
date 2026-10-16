import { personColor } from '../../lib/constants.js'
import styles from './Avatars.module.css'

export function Avatar({ name, size = 24 }) {
  return (
    <span
      className={styles.avatar}
      style={{ '--avatar-color': personColor(name), '--avatar-size': `${size}px` }}
      title={name}
      aria-hidden="true"
    >
      {name === 'Todos' ? '全' : name[0]}
    </span>
  )
}

/** Fila de iniciales superpuestas, p. ej. quién se apunta. */
export default function Avatars({ people, size = 24 }) {
  if (!people?.length) return <span className={styles.empty}>Nadie apuntado</span>
  return (
    <span className={styles.stack} aria-label={`Se apuntan: ${people.join(', ')}`} role="img">
      {people.map((name) => (
        <Avatar key={name} name={name} size={size} />
      ))}
    </span>
  )
}
