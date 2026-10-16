import PlanCard from './PlanCard.jsx'
import styles from './PlanList.module.css'
import SortableList from './SortableList.jsx'

/**
 * Lista de tarjetas. Con `onMove` se puede reordenar arrastrando (solo en el orden del grupo).
 * `cardProps` se pasa a cada tarjeta (me, rate, onOpen, onToggleAttend, onToggleVote).
 */
export default function PlanList({ plans, selectedId, loading, empty, onMove, cardProps }) {
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

  const card = (plan, dragHandle) => (
    <PlanCard plan={plan} selected={plan.id === selectedId} dragHandle={dragHandle} {...cardProps} />
  )

  if (onMove) return <SortableList plans={plans} onMove={onMove} renderItem={card} />

  return (
    <ul className={styles.list}>
      {plans.map((plan) => (
        <li key={plan.id}>{card(plan)}</li>
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
