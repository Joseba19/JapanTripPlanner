import { useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { parseFilters, parseSort, parseView, writeFilters } from '../lib/filterParams.js'
import { countActiveFilters, EMPTY_FILTERS } from '../lib/search.js'

/**
 * Filtros y orden guardados en la URL.
 * Las funciones son estables (setSearchParams cambia de identidad con cada cambio de URL),
 * para no repintar componentes memorizados en cada pulsación.
 */
export function useFilters() {
  const [params, rawSetParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(params), [params])
  const sort = parseSort(params)
  const view = parseView(params)
  const setParamsRef = useRef(rawSetParams)
  setParamsRef.current = rawSetParams
  const setParams = useCallback((...args) => setParamsRef.current(...args), [])

  const setFilters = useCallback(
    (next) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          const current = parseFilters(prev)
          writeFilters(updated, typeof next === 'function' ? next(current) : { ...current, ...next })
          return updated
        },
        { replace: true },
      ),
    [setParams],
  )

  const setSort = useCallback(
    (value) =>
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          if (value === 'manual') updated.delete('sort')
          else updated.set('sort', value)
          return updated
        },
        { replace: true },
      ),
    [setParams],
  )

  // Con push: el botón "atrás" del móvil vuelve de la vista de mapa a la lista
  const setView = useCallback(
    (value) =>
      setParams((prev) => {
        const updated = new URLSearchParams(prev)
        if (value === 'mapa') updated.set('vista', 'mapa')
        else updated.delete('vista')
        return updated
      }),
    [setParams],
  )

  /** Quita los filtros del panel; mantiene búsqueda y ciudad. */
  const clearFilters = useCallback(
    () => setFilters((current) => ({ ...EMPTY_FILTERS, q: current.q, city: current.city })),
    [setFilters],
  )

  return { filters, setFilters, clearFilters, sort, setSort, view, setView, activeCount: countActiveFilters(filters) }
}
