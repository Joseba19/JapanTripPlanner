import { useEffect } from 'react'
import { useToast } from '../components/ui/Toast.jsx'

const CHECK_EVERY_MS = 60 * 60 * 1000 // la app puede pasar días abierta en el móvil

/**
 * Registra el service worker (app precacheada para abrir sin conexión).
 * Si hay una versión nueva no recarga sola, que podría cortar una edición: ofrece "Actualizar".
 */
export function useServiceWorker() {
  const toast = useToast()

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    let timer = null
    let cancelled = false

    import('virtual:pwa-register').then(({ registerSW }) => {
      if (cancelled) return
      const updateSW = registerSW({
        // Se importa después de cargar la página: sin esto esperaría a un evento `load` que ya pasó
        immediate: true,
        onNeedRefresh() {
          toast.show({
            message: 'Hay una versión nueva de la app',
            actionLabel: 'Actualizar',
            onAction: () => updateSW(true),
            duration: 60000,
          })
        },
        onOfflineReady() {
          toast.show({ message: 'Lista para usarse sin conexión' })
        },
        onRegisterError(error) {
          console.warn('No se pudo registrar el service worker:', error)
        },
        onRegisteredSW(_url, registration) {
          if (registration) timer = setInterval(() => registration.update().catch(() => {}), CHECK_EVERY_MS)
        },
      })
    })

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [toast])
}
