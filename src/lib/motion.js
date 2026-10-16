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

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)' // = --ease-out
const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)' // = --ease-in-out

/**
 * Pequeño latido del icono de un botón, como respuesta a que el usuario lo ha pulsado
 * (❤ "me interesa", ✓ "voy"). Con WAAPI y no con CSS para que solo ocurra al pulsar:
 * una regla `[aria-pressed='true'] svg { animation }` latiría también al cargar la lista
 * y con cada cambio que llega por tiempo real.
 * Espera al siguiente fotograma porque el icono puede cambiar (o aparecer) con el propio clic.
 */
export function popIcon(button) {
  if (!button || prefersReducedMotion()) return
  requestAnimationFrame(() => {
    const icon = button.querySelector('svg')
    icon?.animate?.(
      [
        { transform: 'scale(1)', easing: EASE_OUT },
        { transform: 'scale(1.25)', offset: 0.35, easing: EASE_IN_OUT },
        { transform: 'scale(1)' },
      ],
      { duration: 260 },
    )
  })
}
