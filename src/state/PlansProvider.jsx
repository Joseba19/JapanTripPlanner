import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import * as plansApi from '../api/plans.js'
import { fetchSettings, updateRate } from '../api/settings.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useIdentity } from '../hooks/useIdentity.jsx'
import { DEFAULT_EUR_JPY } from '../lib/constants.js'
import { keyForTop } from '../lib/ordering.js'

const PlansContext = createContext(null)

const initialState = { status: 'loading', plans: [], rate: DEFAULT_EUR_JPY, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'loaded':
      return { ...state, status: 'ready', error: null, plans: action.plans, rate: action.rate ?? state.rate }
    case 'failed':
      // Si ya teníamos datos, seguimos mostrándolos
      return { ...state, status: state.status === 'ready' ? 'ready' : 'error', error: action.error }
    case 'upsert': {
      const exists = state.plans.some((p) => p.id === action.plan.id)
      return {
        ...state,
        plans: exists ? state.plans.map((p) => (p.id === action.plan.id ? action.plan : p)) : [...state.plans, action.plan],
      }
    }
    case 'remove':
      return { ...state, plans: state.plans.filter((p) => p.id !== action.id) }
    case 'rate':
      return { ...state, rate: action.rate }
    default:
      return state
  }
}

const describeError = (error) =>
  error?.message?.includes('Failed to fetch') ? 'Sin conexión con el servidor.' : error?.message || 'Algo ha fallado.'

export function PlansProvider({ children }) {
  const { me } = useIdentity()
  const toast = useToast()
  const [state, dispatch] = useReducer(reducer, initialState)
  const plansRef = useRef(state.plans)
  plansRef.current = state.plans

  const load = useCallback(async () => {
    try {
      const [plans, settings] = await Promise.all([plansApi.fetchPlans(), fetchSettings()])
      dispatch({ type: 'loaded', plans, rate: settings?.eur_jpy == null ? null : Number(settings.eur_jpy) })
    } catch (error) {
      dispatch({ type: 'failed', error: describeError(error) })
    }
  }, [])

  useEffect(() => {
    load()
    // Hasta tener tiempo real (fase 2), recargamos al volver a la pestaña o a la app
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  /** Aplica el cambio al instante y lo deshace si el servidor falla. */
  const optimistic = useCallback(
    async (id, patch, request) => {
      const previous = plansRef.current.find((p) => p.id === id)
      if (!previous) return null
      dispatch({ type: 'upsert', plan: { ...previous, ...patch } })
      try {
        const saved = await request()
        dispatch({ type: 'upsert', plan: saved })
        return saved
      } catch (error) {
        dispatch({ type: 'upsert', plan: previous })
        toast.error(`No se pudo guardar: ${describeError(error)}`)
        return null
      }
    },
    [toast],
  )

  const create = useCallback(
    async (values) => {
      try {
        const saved = await plansApi.createPlan({ ...values, position: keyForTop(plansRef.current) }, me)
        dispatch({ type: 'upsert', plan: saved })
        return saved
      } catch (error) {
        throw new Error(describeError(error))
      }
    },
    [me],
  )

  const update = useCallback(
    async (id, patch) => {
      const previous = plansRef.current.find((p) => p.id === id)
      if (!previous) throw new Error('Este plan ya no existe.')
      dispatch({ type: 'upsert', plan: { ...previous, ...patch, updated_by: me } })
      try {
        const saved = await plansApi.updatePlan(id, patch, me)
        dispatch({ type: 'upsert', plan: saved })
        return saved
      } catch (error) {
        dispatch({ type: 'upsert', plan: previous })
        throw new Error(describeError(error))
      }
    },
    [me],
  )

  const setStatus = useCallback(
    (id, status) => optimistic(id, { status, updated_by: me }, () => plansApi.updatePlan(id, { status }, me)),
    [me, optimistic],
  )

  const restore = useCallback(
    async (id) => {
      const saved = await optimistic(id, { archived_at: null, archived_by: null }, () => plansApi.restorePlan(id, me))
      if (saved) toast.show({ message: `«${saved.title}» vuelve a la lista` })
      return saved
    },
    [me, optimistic, toast],
  )

  const archive = useCallback(
    async (id) => {
      const saved = await optimistic(
        id,
        { archived_at: new Date().toISOString(), archived_by: me },
        () => plansApi.archivePlan(id, me),
      )
      if (saved) {
        toast.show({
          message: `«${saved.title}» archivado`,
          actionLabel: 'Deshacer',
          onAction: () => restore(id),
          duration: 6000,
        })
      }
      return saved
    },
    [me, optimistic, restore, toast],
  )

  const destroy = useCallback(
    async (id) => {
      try {
        await plansApi.deletePlan(id)
        dispatch({ type: 'remove', id })
        return true
      } catch (error) {
        toast.error(`No se pudo borrar: ${describeError(error)}`)
        return false
      }
    },
    [toast],
  )

  const setRate = useCallback(
    async (rate) => {
      const saved = await updateRate(rate, me)
      dispatch({ type: 'rate', rate: Number(saved.eur_jpy) })
    },
    [me],
  )

  const value = useMemo(() => {
    const active = []
    const archived = []
    for (const plan of state.plans) (plan.archived_at ? archived : active).push(plan)
    return { ...state, active, archived, reload: load, create, update, setStatus, archive, restore, destroy, setRate }
  }, [state, load, create, update, setStatus, archive, restore, destroy, setRate])

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>
}

export function usePlans() {
  const context = useContext(PlansContext)
  if (!context) throw new Error('usePlans debe usarse dentro de <PlansProvider>')
  return context
}
