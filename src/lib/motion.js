// Preferencia de movimiento reducido y vibración háptica (solo Android; iOS no expone la API).

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Vibración cortita como respuesta a un toque. No hace nada con movimiento reducido o sin soporte. */
export function haptic(ms = 8) {
  if (prefersReducedMotion()) return
  try {
    navigator.vibrate?.(ms)
  } catch {
    // Algunos navegadores lo bloquean sin interacción previa: no pasa nada
  }
}

export const scrollBehavior = () => (prefersReducedMotion() ? 'auto' : 'smooth')
