import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { removeCover } from '../api/covers.js'
import * as plansApi from '../api/plans.js'
import { fetchSettings, updateRate } from '../api/settings.js'
import { useToast } from '../components/ui/Toast.jsx'
import { useIdentity } from '../hooks/useIdentity.jsx'
import { useOnline } from '../hooks/useOnline.js'
import { useRealtimePlans } from '../hooks/useRealtimePlans.js'
import { DEFAULT_EUR_JPY } from '../lib/constants.js'
import { keyForTop } from '../lib/ordering.js'
import { readSnapshot, writeSnapshot } from '../lib/snapshot.js'

const PlansContext = createContext(null)

const RETRY_MS = 20000 // sin respuesta del servidor: reintento periódico

/**
 * Si hay copia local, la app arranca con ella (al instante y también sin conexión) y luego se actualiza.
 * `syncedAt`: cuándo se recibieron los datos del servidor por última vez.
 * `unreachable`: la última carga falló por la red, aunque el navegador crea que hay conexión.
 */
function initState() {
  const snapshot = readSnapshot()
  return snapshot
    ? { status: 'ready', plans: snapshot.plans, rate: snapshot.rate ?? DEFAULT_EUR_JPY, error: null, syncedAt: snapshot.savedAt, unreachable: false }
    : { status: 'loading', plans: [], rate: DEFAULT_EUR_JPY, error: null, syncedAt: null, unreachable: false }
}

function reducer(state, action) {
  switch (action.type) {
    case 'loaded':
      return {
        ...state,
        status: 'ready',
        error: null,
        plans: action.plans,
        rate: action.rate ?? state.rate,
        syncedAt: Date.now(),
        unreachable: false,
      }
    case 'failed':
      // Si ya teníamos datos (o la copia local), seguimos mostrándolos
      return {
        ...state,
        status: state.status === 'ready' ? 'ready' : 'error',
        error: action.error,
        unreachable: action.network,
      }
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

// Chrome: "Failed to fetch" · Safari: "Load failed" · Firefox: "NetworkError…"
const isNetworkError = (error) => /Failed to fetch|Load failed|NetworkError|Network request failed/i.test(error?.message ?? '')

const describeError = (error) =>
  isNetworkError(error) ? 'Sin conexión con el servidor.' : error?.message || 'Algo ha fallado.'

const OFFLINE_MESSAGE = 'Sin conexión: por ahora solo se pueden consultar los planes.'

export function PlansProvider({ children }) {
  const { me } = useIdentity()
  const toast = useToast()
  const [state, dispatch] = useReducer(reducer, undefined, initState)
  const plansRef = useRef(state.plans)
  plansRef.current = state.plans

  // Sin conexión la app es de solo lectura: se ve todo, pero no se puede cambiar nada
  const online = useOnline()
  const offline = !online || state.unreachable
  const offlineRef = useRef(offline)
  offlineRef.current = offline

  const load = useCallback(async () => {
    try {
      const [plans, settings] = await Promise.all([plansApi.fetchPlans(), fetchSettings()])
      dispatch({ type: 'loaded', plans, rate: settings?.eur_jpy == null ? null : Number(settings.eur_jpy) })
    } catch (error) {
      dispatch({ type: 'failed', error: describeError(error), network: isNetworkError(error) })
    }
  }, [])

  useEffect(() => {
    load()
    // Red de seguridad: el móvil corta el WebSocket en segundo plano, así que al volver recargamos
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', load)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', load)
    }
  }, [load])

  // Hay red pero el servidor no contesta (wifi con portal, cobertura mínima): reintentamos de vez en cuando
  useEffect(() => {
    if (!online || !state.unreachable) return
    const timer = setInterval(load, RETRY_MS)
    return () => clearInterval(timer)
  }, [online, state.unreachable, load])

  // Copia local para la próxima vez (y para abrir sin conexión). Se agrupan los cambios seguidos.
  useEffect(() => {
    if (state.status !== 'ready' || state.syncedAt == null) return
    const timer = setTimeout(() => writeSnapshot({ plans: state.plans, rate: state.rate, savedAt: state.syncedAt }), 500)
    return () => clearTimeout(timer)
  }, [state.status, state.plans, state.rate, state.syncedAt])

  /** true (y avisa) si no se puede escribir porque no hay conexión. */
  const blockedOffline = useCallback(() => {
    if (!offlineRef.current) return false
    toast.error(OFFLINE_MESSAGE)
    return true
  }, [toast])

  useRealtimePlans({
    onUpsert: (plan, type) => {
      const isNew = type === 'INSERT' && !plansRef.current.some((p) => p.id === plan.id)
      dispatch({ type: 'upsert', plan })
      if (isNew && plan.created_by && plan.created_by !== me) {
        toast.show({ message: `${plan.created_by} ha añadido «${plan.title}»` })
      }
    },
    onDelete: (id) => dispatch({ type: 'remove', id }),
    onRate: (rate) => dispatch({ type: 'rate', rate }),
    onResync: load,
  })

  /** Aplica el cambio al instante y lo deshace si el servidor falla. */
  const optimistic = useCallback(
    async (id, patch, request) => {
      const previous = plansRef.current.find((p) => p.id === id)
      if (!previous || blockedOffline()) return null
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
    [toast, blockedOffline],
  )

  const create = useCallback(
    async (values) => {
      if (offlineRef.current) throw new Error(OFFLINE_MESSAGE)
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
      if (offlineRef.current) throw new Error(OFFLINE_MESSAGE)
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

  const toggleIn = (list, name) => (list.includes(name) ? list.filter((n) => n !== name) : [...list, name])

  const toggleAttendee = useCallback(
    (id) => {
      const plan = plansRef.current.find((p) => p.id === id)
      if (!plan) return null
      return optimistic(id, { attendees: toggleIn(plan.attendees, me), updated_by: me }, () => plansApi.toggleAttendee(id, me))
    },
    [me, optimistic],
  )

  const toggleVote = useCallback(
    (id) => {
      const plan = plansRef.current.find((p) => p.id === id)
      if (!plan) return null
      return optimistic(id, { votes: toggleIn(plan.votes, me), updated_by: me }, () => plansApi.toggleVote(id, me))
    },
    [me, optimistic],
  )

  /** Nueva posición en el orden del grupo (arrastrar y soltar). */
  const move = useCallback(
    (id, position) => optimistic(id, { position, updated_by: me }, () => plansApi.updatePlan(id, { position }, me)),
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
      const plan = plansRef.current.find((p) => p.id === id)
      if (blockedOffline()) return false
      try {
        await plansApi.deletePlan(id)
        dispatch({ type: 'remove', id })
        if (plan?.image_url) removeCover(plan.image_url)
        return true
      } catch (error) {
        toast.error(`No se pudo borrar: ${describeError(error)}`)
        return false
      }
    },
    [toast, blockedOffline],
  )

  const setRate = useCallback(
    async (rate) => {
      if (offlineRef.current) throw new Error(OFFLINE_MESSAGE)
      const saved = await updateRate(rate, me)
      dispatch({ type: 'rate', rate: Number(saved.eur_jpy) })
    },
    [me],
  )

  const value = useMemo(() => {
    const active = []
    const archived = []
    for (const plan of state.plans) (plan.archived_at ? archived : active).push(plan)
    return {
      ...state,
      offline,
      active,
      archived,
      reload: load,
      create,
      update,
      setStatus,
      toggleAttendee,
      toggleVote,
      move,
      archive,
      restore,
      destroy,
      setRate,
    }
  }, [state, offline, load, create, update, setStatus, toggleAttendee, toggleVote, move, archive, restore, destroy, setRate])

  return <PlansContext.Provider value={value}>{children}</PlansContext.Provider>
}

export function usePlans() {
  const context = useContext(PlansContext)
  if (!context) throw new Error('usePlans debe usarse dentro de <PlansProvider>')
  return context
}
