import { useEffect, useState } from 'react'
import { fetchEvents } from '../../api/plans.js'
import { describeEvent } from '../../lib/events.js'
import { relativeTime } from '../../lib/format.js'
import { Avatar } from '../ui/Avatars.jsx'
import styles from './PlanHistory.module.css'

const PAGE = 5

/** Historial del plan. Se recarga cuando el plan cambia (`version` = su updated_at). */
export default function PlanHistory({ planId, version }) {
  const [events, setEvents] = useState(null)
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchEvents(planId)
      .then((data) => !cancelled && (setEvents(data), setFailed(false)))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [planId, version])

  if (failed) return <p className={styles.muted}>No se pudo cargar el historial.</p>
  if (!events) return <p className={styles.muted}>Cargando…</p>
  if (!events.length) return <p className={styles.muted}>Sin cambios registrados.</p>

  const shown = expanded ? events : events.slice(0, PAGE)
  return (
    <>
      <ol className={styles.list}>
        {shown.map((event) => (
          <li key={event.id} className={styles.event}>
            {event.actor ? <Avatar name={event.actor} size={22} /> : <span className={styles.dot} aria-hidden="true" />}
            <span className={styles.text}>
              <strong>{event.actor ?? 'Alguien'}</strong> {describeEvent(event)}
            </span>
            <time className={styles.time} dateTime={event.at} title={new Date(event.at).toLocaleString('es-ES')}>
              {relativeTime(event.at)}
            </time>
          </li>
        ))}
      </ol>
      {events.length > PAGE && (
        <button type="button" className={styles.more} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Ver menos' : `Ver ${events.length - PAGE} más`}
        </button>
      )}
    </>
  )
}
