import { memo, useEffect, useState } from 'react'
import PlanCard from './PlanCard.jsx'
import styles from './PlanList.module.css'
import SortableList, { STAGGERED } from './SortableList.jsx'

// Entrada escalonada: 300 ms por tarjeta + 50 ms entre cada una de las primeras STAGGERED
const ENTRANCE_MS = 300 + 50 * STAGGERED
// Solo la primera vez que se ve la lista en la sesión (al abrir la app). Filtrar o cambiar de vista
// pasa decenas de veces al día: ahí las tarjetas aparecen sin más, que es lo rápido.
let entrancePlayed = false

/**
 * Lista de tarjetas.
 * - `plans`: todos los planes activos, ya ordenados. `visibleIds`: los que pasan los filtros.
 *   Las tarjetas se montan una vez y filtrar solo las oculta: con 100+ planes, montar y desmontar
 *   en cada pulsación costaba ~200 ms en un móvil de gama media.
 * - Con `onMove` se puede reordenar arrastrando (solo en el orden del grupo).
 * - `cardProps` se pasa a cada tarjeta (me, rate, onOpen, onToggleAttend, onToggleVote).
 */
export default memo(function PlanList({ plans, visibleIds, selectedId, loading, empty, onMove, cardProps }) {
  const [entering, setEntering] = useState(!entrancePlayed)
  useEffect(() => {
    if (loading || !entering) return
    entrancePlayed = true
    const timer = setTimeout(() => setEntering(false), ENTRANCE_MS)
    return () => clearTimeout(timer)
  }, [loading, entering])

  if (loading) {
    return (
      <ul className={styles.list} aria-busy="true" aria-label="Cargando planes">
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className={styles.skeleton} style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </ul>
    )
  }

  const card = (plan, dragHandle) => (
    <PlanCard plan={plan} selected={plan.id === selectedId} dragHandle={dragHandle} {...cardProps} />
  )

  // Posición de cada plan entre los visibles: para el escalonado de la animación de entrada
  const visibleIndex = new Map()
  for (const plan of plans) if (visibleIds.has(plan.id)) visibleIndex.set(plan.id, visibleIndex.size)

  return (
    <>
      {visibleIds.size === 0 && empty}
      {onMove ? (
        <SortableList plans={plans} visibleIndex={visibleIndex} entering={entering} onMove={onMove} renderItem={card} />
      ) : (
        <ul className={styles.list} data-entering={entering || undefined}>
          {plans.map((plan) => (
            <li
              key={plan.id}
              hidden={!visibleIndex.has(plan.id)}
              data-stagger={visibleIndex.get(plan.id) < STAGGERED || undefined}
              style={{ '--i': visibleIndex.get(plan.id) }}
            >
              {card(plan)}
            </li>
          ))}
        </ul>
      )}
    </>
  )
})

export function EmptyState({ kanji = '空', title, children, action }) {
  return (
    <div className={styles.empty}>
      <span className={styles.enso} aria-hidden="true">
        {/* Ensō: el círculo zen de un solo trazo, que se dibuja al aparecer */}
        <svg viewBox="0 0 100 100">
          <path className={styles.ensoBack} d="M57 9 C 82 13, 95 36, 90 60 C 85 84, 60 95, 38 89 C 15 82, 5 58, 11 36 C 16 20, 28 11, 41 9" pathLength="1" />
          <path className={styles.ensoInk} d="M57 9 C 82 13, 95 36, 90 60 C 85 84, 60 95, 38 89 C 15 82, 5 58, 11 36 C 16 20, 28 11, 41 9" pathLength="1" />
        </svg>
        <span className="kanji">{kanji}</span>
      </span>
      <p className={styles.emptyTitle}>{title}</p>
      {children && <p className={styles.emptyText}>{children}</p>}
      {action}
    </div>
  )
}
