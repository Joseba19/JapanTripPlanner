import { useCallback } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

const OVERLAY_KEYS = ['plan', 'edit', 'new']

/**
 * Detalle y formulario abiertos según la URL: ?plan=<id>, ?edit=<id> o ?new=1.
 * Se abren con push, así que el botón "atrás" del móvil los cierra.
 */
export function useOverlay() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()

  const go = useCallback(
    (key, value, { replace = false } = {}) => {
      const next = new URLSearchParams(location.search)
      OVERLAY_KEYS.forEach((k) => next.delete(k))
      if (key) next.set(key, value)
      const depth = (location.state?.overlayDepth ?? 0) + (replace ? 0 : 1)
      navigate({ search: next.toString() }, { replace, state: { overlayDepth: depth } })
    },
    [location.search, location.state, navigate],
  )

  const close = useCallback(() => {
    // Si lo abrimos nosotros, volvemos atrás; si se entró por un enlace directo, quitamos el parámetro.
    if (location.state?.overlayDepth > 0) {
      navigate(-1)
    } else {
      const next = new URLSearchParams(location.search)
      OVERLAY_KEYS.forEach((k) => next.delete(k))
      navigate({ search: next.toString() }, { replace: true })
    }
  }, [location.search, location.state, navigate])

  return {
    planId: params.get('plan'),
    editId: params.get('edit'),
    isNew: params.get('new') === '1',
    openPlan: useCallback((id) => go('plan', id), [go]),
    openEdit: useCallback((id) => go('edit', id), [go]),
    openNew: useCallback(() => go('new', '1'), [go]),
    showPlan: useCallback((id) => go('plan', id, { replace: true }), [go]),
    close,
  }
}
