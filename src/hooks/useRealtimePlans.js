import { useEffect, useRef } from 'react'
import { SUPABASE_KEY, SUPABASE_URL } from '../lib/supabase.js'

// realtime-js se carga aparte, después de pintar la app: no hace falta para la primera carga
let clientPromise = null
const getClient = () => {
  clientPromise ??= import('@supabase/realtime-js').then(
    ({ RealtimeClient }) => new RealtimeClient(`${SUPABASE_URL}/realtime/v1`, { params: { apikey: SUPABASE_KEY } }),
  )
  return clientPromise
}

/**
 * Escucha los cambios de `plans` y `settings` en Supabase Realtime.
 * handlers: { onUpsert(plan, eventType), onDelete(id), onRate(rate), onResync() }
 * onResync se llama al reconectar, para recuperar lo que se haya perdido mientras no había conexión.
 */
export function useRealtimePlans(handlers) {
  const ref = useRef(handlers)
  ref.current = handlers

  useEffect(() => {
    let cancelled = false
    let channel = null
    let joinedOnce = false

    getClient()
      .then((client) => {
        if (cancelled) return
        channel = client
          .channel('trip-db')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, (payload) => {
            if (payload.eventType === 'DELETE') ref.current.onDelete(payload.old.id)
            else ref.current.onUpsert(payload.new, payload.eventType)
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (payload) => {
            if (payload.new?.eur_jpy != null) ref.current.onRate(Number(payload.new.eur_jpy))
          })
          .subscribe((status) => {
            if (status !== 'SUBSCRIBED') return
            if (joinedOnce) ref.current.onResync()
            joinedOnce = true
          })
      })
      .catch((error) => console.warn('Tiempo real no disponible', error))

    return () => {
      cancelled = true
      if (channel) getClient().then((client) => client.removeChannel(channel))
    }
  }, [])
}
