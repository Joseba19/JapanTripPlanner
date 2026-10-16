import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import styles from './Toast.module.css'

const ToastContext = createContext(null)
let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef(new Map())

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    ({ message, actionLabel, onAction, tone = 'info', duration = 4000 }) => {
      const id = ++nextId
      setToasts((list) => [...list.slice(-2), { id, message, actionLabel, onAction, tone, duration }])
      timers.current.set(id, setTimeout(() => dismiss(id), duration))
      return id
    },
    [dismiss],
  )

  const api = useMemo(
    () => ({ show, dismiss, error: (message) => show({ message, tone: 'error', duration: 7000 }) }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast} data-tone={toast.tone} data-toast>
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
                  data-keep-motion
                  style={{ '--keep-duration': `${toast.duration}ms`, animationDuration: `${toast.duration}ms` }}
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
