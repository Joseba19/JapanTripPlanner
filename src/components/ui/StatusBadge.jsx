import { STATUS_BY_ID } from '../../lib/constants.js'
import styles from './StatusBadge.module.css'

// En la fase 3 se convierte en un sello hanko animado
export default function StatusBadge({ status }) {
  const info = STATUS_BY_ID[status] ?? STATUS_BY_ID.idea
  return (
    <span className={styles.badge} data-status={info.id}>
      <span className={`${styles.kanji} kanji`} aria-hidden="true">{info.kanji}</span>
      {info.label}
    </span>
  )
}
