import { generateKeyBetween } from 'fractional-indexing'

/** Clave de posición para colocar un plan nuevo el primero de la lista. */
export function keyForTop(plans) {
  let first = null
  for (const plan of plans) {
    if (first === null || plan.position < first) first = plan.position
  }
  return generateKeyBetween(null, first)
}

/**
 * Nueva clave para un plan arrastrado a `toIndex` dentro de la lista visible (que puede estar filtrada).
 * Se coloca justo después del plan visible que le queda encima, o justo antes del primero si sube arriba del todo.
 * Los vecinos se buscan en la lista completa, así que los planes ocultos por el filtro no se descolocan.
 * Si dos planes tuvieran la misma clave (dos altas a la vez), se salta al siguiente valor distinto.
 * Devuelve null si el plan no cambia de sitio.
 */
export function positionForMove(allPlans, visible, fromIndex, toIndex) {
  if (fromIndex === toIndex) return null
  const moved = visible[fromIndex]
  const rest = visible.filter((_, i) => i !== fromIndex)
  const others = allPlans.filter((p) => p.id !== moved.id)

  if (toIndex === 0) {
    const anchor = rest[0].position
    let lower = null
    for (const p of others) if (p.position < anchor && (lower === null || p.position > lower)) lower = p.position
    return generateKeyBetween(lower, anchor)
  }

  const anchor = rest[toIndex - 1].position
  let upper = null
  for (const p of others) if (p.position > anchor && (upper === null || p.position < upper)) upper = p.position
  return generateKeyBetween(anchor, upper)
}
