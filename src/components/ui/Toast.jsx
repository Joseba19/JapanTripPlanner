import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import styles from './Toast.module.css'

const ToastContext = createContext(null)
let nextId = 0

const EXIT_MS = 250 // = duración de salida en Toast.module.css

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  // id → { timeout, deadline, remaining }: el tiempo que le queda a cada aviso, para poder pausarlo
  const timers = useRef(new Map())
  const pauses = useRef(new Set())
  const [paused, setPaused] = useState(false)

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  // Sale por donde entró y, al terminar, se quita
  const dismiss = useCallback(
    (id) => {
      clearTimeout(timers.current.get(id)?.timeout)
      timers.current.delete(id)
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
      setTimeout(() => remove(id), EXIT_MS)
    },
    [remove],
  )

  const schedule = useCallback(
    (id, ms) => {
      if (pauses.current.size) {
        timers.current.set(id, { remaining: ms })
        return
      }
      timers.current.set(id, { timeout: setTimeout(() => dismiss(id), ms), deadline: Date.now() + ms })
    },
    [dismiss],
  )

  const show = useCallback(
    ({ message, actionLabel, onAction, tone = 'info', duration = 4000 }) => {
      const id = ++nextId
      setToasts((list) => [...list.filter((t) => !t.leaving).slice(-2), { id, message, actionLabel, onAction, tone, duration }])
      schedule(id, duration)
      return id
    },
    [schedule],
  )

  // Pausa la cuenta atrás mientras la pestaña está oculta o el ratón está encima:
  // quien vuelve de otra app o va a pulsar "Deshacer" no debe perder el aviso.
  const setPause = useCallback(
    (reason, on) => {
      const was = pauses.current.size > 0
      if (on) pauses.current.add(reason)
      else pauses.current.delete(reason)
      const now = pauses.current.size > 0
      if (was === now) return
      setPaused(now)
      for (const [id, timer] of timers.current) {
        if (now) {
          clearTimeout(timer.timeout)
          timers.current.set(id, { remaining: Math.max(0, timer.deadline - Date.now()) })
        } else {
          schedule(id, timer.remaining)
        }
      }
    },
    [schedule],
  )

  useEffect(() => {
    const onVisibility = () => setPause('hidden', document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [setPause])

  const api = useMemo(
    () => ({ show, dismiss, error: (message) => show({ message, tone: 'error', duration: 7000 }) }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className={styles.region}
        role="status"
        aria-live="polite"
        data-paused={paused || undefined}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setPause('hover', true)}
        onPointerLeave={(event) => event.pointerType === 'mouse' && setPause('hover', false)}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast} data-tone={toast.tone} data-leaving={toast.leaving || undefined} data-toast>
            <span className={styles.message}>{toast.message}</span>
            {toast.actionLabel && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  dismiss(toast.id)
                  toast.onAction?.()
                }}
              >
                {toast.actionLabel}
              </button>
            )}
            <button type="button" className={styles.close} onClick={() => dismiss(toast.id)} aria-label="Cerrar aviso">
              ×
            </button>
            {toast.actionLabel && (
              // Pincelada que se consume: el tiempo que queda para deshacer
              <svg className={styles.timer} viewBox="0 0 100 4" preserveAspectRatio="none" aria-hidden="true">
                <path
                  d="M1 2.4 C 20 1.2, 38 3.1, 55 2.2 S 86 1.5, 99 2.5"
                  pathLength="1"
                  style={{ animationDuration: `${toast.duration}ms` }}
                />
              </svg>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return context
}
