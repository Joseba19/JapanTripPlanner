import { readStored, writeStored } from './storage.js'

// Copia local de los planes para abrir la app sin conexión (solo lectura).
// Son pocos (< 500, ~1 KB cada uno): caben de sobra en localStorage.
const KEY = 'snapshot'
const VERSION = 1

/** Devuelve { plans, rate, savedAt } o null si no hay copia o no es válida. */
export function parseSnapshot(value) {
  if (!value || value.v !== VERSION || !Array.isArray(value.plans)) return null
  if (typeof value.savedAt !== 'number') return null
  return { plans: value.plans, rate: typeof value.rate === 'number' ? value.rate : null, savedAt: value.savedAt }
}

export const readSnapshot = () => parseSnapshot(readStored(KEY))

export function writeSnapshot({ plans, rate, savedAt }) {
  writeStored(KEY, { v: VERSION, plans, rate, savedAt })
}
