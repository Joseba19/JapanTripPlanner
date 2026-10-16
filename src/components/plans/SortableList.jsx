import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo } from 'react'
import { haptic, prefersReducedMotion } from '../../lib/motion.js'
import listStyles from './PlanList.module.css'
import styles from './SortableList.module.css'

export const STAGGERED = 10 // primeras tarjetas visibles con animación de entrada

const screenReaderInstructions = {
  draggable:
    'Para mover el plan, pulsa espacio o Enter. Muévelo con las flechas y vuelve a pulsar espacio o Enter para soltarlo. Escape cancela.',
}

/**
 * Lista reordenable con dedo (mantener pulsado el asa), ratón y teclado.
 * `plans` son todos; solo los de `visibleIndex` se ven y se pueden mover (los demás quedan ocultos y desactivados).
 * `renderItem(plan, dragHandleProps)` pinta cada tarjeta; `onMove(fromIndex, toIndex)` recibe índices de la lista visible.
 */
export default function SortableList({ plans, visibleIndex, entering, renderItem, onMove }) {
  const sensors = useSensors(
    // Ratón: basta con moverlo 4 px para empezar
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Dedo: mantener pulsado 250 ms sin moverse más de 8 px, para no confundirlo con hacer scroll
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => [...visibleIndex.keys()], [visibleIndex])
  const title = (id) => plans.find((p) => p.id === id)?.title ?? 'el plan'
  const position = (id) => ids.indexOf(id) + 1

  const announcements = {
    onDragStart: ({ active }) => `Has cogido «${title(active.id)}», posición ${position(active.id)} de ${ids.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `«${title(active.id)}» está en la posición ${position(over.id)} de ${ids.length}.` : `«${title(active.id)}» está fuera de la lista.`,
    onDragEnd: ({ active, over }) =>
      over ? `«${title(active.id)}» colocado en la posición ${position(over.id)}.` : `«${title(active.id)}» vuelve a su sitio.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. «${title(active.id)}» vuelve a su sitio.`,
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      accessibility={{ announcements, screenReaderInstructions }}
      onDragStart={() => haptic(10)}
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        haptic(6)
        onMove(ids.indexOf(active.id), ids.indexOf(over.id))
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={listStyles.list} data-entering={entering || undefined}>
          {plans.map((plan) => (
            <SortableItem key={plan.id} plan={plan} index={visibleIndex.get(plan.id)} renderItem={renderItem} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ plan, index, renderItem }) {
  const hidden = index === undefined
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: plan.id,
    // Oculto por un filtro: ni se arrastra ni cuenta como destino al soltar
    disabled: hidden,
  })
  return (
    <li
      ref={setNodeRef}
      hidden={hidden}
      data-stagger={index < STAGGERED || undefined}
      className={styles.item}
      data-dragging={isDragging || undefined}
      // Con movimiento reducido, las demás tarjetas cambian de sitio sin deslizarse
      style={{ transform: CSS.Translate.toString(transform), transition: prefersReducedMotion() ? undefined : transition, '--i': index }}
    >
      {renderItem(plan, {
        ref: setActivatorNodeRef,
        ...attributes,
        ...listeners,
        'aria-label': `Mover «${plan.title}»`,
      })}
    </li>
  )
}
