import { useSyncExternalStore } from 'react'

function subscribe(onChange) {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/**
 * Si el navegador cree que hay red. `true` no garantiza que Supabase responda
 * (wifi de hotel con portal, cobertura mínima…): eso lo detecta PlansProvider al cargar.
 */
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}
