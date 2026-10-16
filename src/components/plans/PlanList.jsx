import PlanCard from './PlanCard.jsx'
import styles from './PlanList.module.css'

export default function PlanList({ plans, rate, selectedId, onOpen, loading, empty }) {
  if (loading) {
    return (
      <ul className={styles.list} aria-busy="true" aria-label="Cargando planes">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={styles.skeleton} style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </ul>
    )
  }

  if (!plans.length) return empty

  return (
    <ul className={styles.list}>
      {plans.map((plan) => (
        <li key={plan.id}>
          <PlanCard plan={plan} rate={rate} selected={plan.id === selectedId} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}

export function EmptyState({ kanji = '空', title, children, action }) {
  return (
    <div className={styles.empty}>
      <span className={`${styles.emptyKanji} kanji`} aria-hidden="true">{kanji}</span>
      <p className={styles.emptyTitle}>{title}</p>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action}
    </div>
  )
}
