import { generateKeyBetween } from 'fractional-indexing'

/** Clave de posición para colocar un plan nuevo el primero de la lista. */
export function keyForTop(plans) {
  let first = null
  for (const plan of plans) {
    if (first === null || plan.position < first) first = plan.position
  }
  return generateKeyBetween(null, first)
}
