import { useCallback, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

const OVERLAY_KEYS = ['plan', 'edit', 'new']

/**
 * Detalle y formulario abiertos según la URL: ?plan=<id>, ?edit=<id> o ?new=1.
 * Se abren con push, así que el botón "atrás" del móvil los cierra.
 * Las funciones son estables (leen la URL actual de una ref): así las tarjetas memorizadas
 * no se vuelven a pintar cada vez que cambia un filtro.
 */
export function useOverlay() {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const latest = useRef(null)
  latest.current = { location, navigate }

  const go = useCallback((key, value, { replace = false } = {}) => {
    const { location, navigate } = latest.current
    const next = new URLSearchParams(location.search)
    OVERLAY_KEYS.forEach((k) => next.delete(k))
    if (key) next.set(key, value)
    const depth = (location.state?.overlayDepth ?? 0) + (replace ? 0 : 1)
    navigate({ search: next.toString() }, { replace, state: { overlayDepth: depth } })
  }, [])

  const close = useCallback(() => {
    const { location, navigate } = latest.current
    // Si lo abrimos nosotros, volvemos atrás; si se entró por un enlace directo, quitamos el parámetro.
    if (location.state?.overlayDepth > 0) {
      navigate(-1)
    } else {
      const next = new URLSearchParams(location.search)
      OVERLAY_KEYS.forEach((k) => next.delete(k))
      navigate({ search: next.toString() }, { replace: true })
    }
  }, [])

  const actions = useMemo(
    () => ({
      openPlan: (id) => go('plan', id),
      openEdit: (id) => go('edit', id),
      openNew: () => go('new', '1'),
      showPlan: (id) => go('plan', id, { replace: true }),
      close,
    }),
    [go, close],
  )

  return {
    planId: params.get('plan'),
    editId: params.get('edit'),
    isNew: params.get('new') === '1',
    ...actions,
  }
}
