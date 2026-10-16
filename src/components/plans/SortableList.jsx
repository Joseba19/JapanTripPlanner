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
import listStyles from './PlanList.module.css'
import styles from './SortableList.module.css'

const screenReaderInstructions = {
  draggable:
    'Para mover el plan, pulsa espacio o Enter. Muévelo con las flechas y vuelve a pulsar espacio o Enter para soltarlo. Escape cancela.',
}

/**
 * Lista reordenable con dedo (mantener pulsado el asa), ratón y teclado.
 * `renderItem(plan, dragHandleProps)` pinta cada tarjeta; `onMove(fromIndex, toIndex)` se llama al soltar.
 */
export default function SortableList({ plans, renderItem, onMove }) {
  const sensors = useSensors(
    // Ratón: basta con moverlo 4 px para empezar
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Dedo: mantener pulsado 250 ms sin moverse más de 8 px, para no confundirlo con hacer scroll
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const ids = useMemo(() => plans.map((p) => p.id), [plans])
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
      onDragEnd={({ active, over }) => {
        if (!over || active.id === over.id) return
        onMove(ids.indexOf(active.id), ids.indexOf(over.id))
      }}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <ul className={listStyles.list}>
          {plans.map((plan) => (
            <SortableItem key={plan.id} plan={plan} renderItem={renderItem} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

function SortableItem({ plan, renderItem }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: plan.id,
  })
  return (
    <li
      ref={setNodeRef}
      className={styles.item}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
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
