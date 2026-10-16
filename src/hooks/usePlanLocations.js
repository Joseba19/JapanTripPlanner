import { useEffect, useMemo, useState } from 'react'
import { locatePlans } from '../lib/geo.js'
import { readStored, writeStored } from '../lib/storage.js'

// Enlaces ya situados en este dispositivo: { [enlace]: { lat, lng } | { miss: timestamp } }.
// Así el mapa sale al instante (también sin conexión) y cada enlace se pregunta una sola vez.
const STORE_KEY = 'geo'
const CONCURRENCY = 2

// Peticiones en curso o que han fallado en esta sesión (servidor caído, `npm run dev` sin /api…):
// no se repiten en bucle; se vuelve a intentar al recargar.
const inFlight = new Set()
const failedThisSession = new Set()

async function resolve(link) {
  const response = await fetch(`/api/geocode?url=${encodeURIComponent(link)}`)
  const type = response.headers.get('content-type') ?? ''
  if (!response.ok || !type.includes('application/json')) throw new Error(`/api/geocode respondió ${response.status}`)
  const body = await response.json()
  return body.lat == null ? { miss: Date.now() } : { lat: body.lat, lng: body.lng }
}

/**
 * Planes situados en el mapa. Con `enabled` en false no hace peticiones (la vista de lista no las necesita).
 * Devuelve { points, pending, unresolved, withoutLink } (ver locatePlans).
 */
export function usePlanLocations(plans, { enabled, offline }) {
  const [cache, setCache] = useState(() => readStored(STORE_KEY) ?? {})
  const located = useMemo(() => locatePlans(plans, cache), [plans, cache])
  const toFetch = located.toResolve.filter((link) => !failedThisSession.has(link))
  const toFetchKey = toFetch.join('\n')

  useEffect(() => {
    if (!enabled || offline || !toFetchKey) return
    let cancelled = false
    const queue = toFetchKey.split('\n').filter((link) => !inFlight.has(link))

    const worker = async () => {
      while (queue.length && !cancelled) {
        const link = queue.shift()
        inFlight.add(link)
        try {
          const entry = await resolve(link)
          setCache((current) => {
            const next = { ...current, [link]: entry }
            writeStored(STORE_KEY, next)
            return next
          })
        } catch {
          failedThisSession.add(link)
          setCache((current) => ({ ...current })) // vuelve a repartir: el enlace deja de contar como pendiente
        } finally {
          inFlight.delete(link)
        }
      }
    }
    for (let i = 0; i < CONCURRENCY; i++) worker()
    return () => {
      cancelled = true
    }
  }, [enabled, offline, toFetchKey])

  // Los que fallaron en esta sesión se muestran como "sin situar" hasta la próxima vez
  const waiting = new Set(toFetch)
  const failed = plans.filter((plan) => failedThisSession.has(plan.location?.trim()))
  return {
    points: located.points,
    pending: plans.filter((plan) => waiting.has(plan.location?.trim())).length,
    unresolved: [...located.unresolved, ...failed],
    withoutLink: located.withoutLink,
  }
}
