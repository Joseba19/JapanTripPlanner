import { memo } from 'react'
import { CATEGORY_BY_ID, CITY_BY_ID, cityColor } from '../../lib/constants.js'
import { formatDuration, formatPrice } from '../../lib/format.js'
import { haptic } from '../../lib/motion.js'
import Avatars from '../ui/Avatars.jsx'
import Icon from '../ui/Icon.jsx'
import Stamp from '../ui/Stamp.jsx'
import styles from './PlanCard.module.css'
import PlanCover from './PlanCover.jsx'

/**
 * `dragHandle`: props del asa cuando la lista se puede reordenar (orden del grupo).
 * `readOnly`: sin conexión no se puede apuntar ni votar.
 */
function PlanCard({ plan, rate, me, selected, readOnly, onOpen, onToggleAttend, onToggleVote, dragHandle }) {
  const city = CITY_BY_ID[plan.city]
  const category = CATEGORY_BY_ID[plan.category]
  const price = formatPrice(plan, rate)
  const duration = formatDuration(plan.duration_min)
  const going = plan.attendees.includes(me)
  const voted = plan.votes?.includes(me)

  return (
    <article
      className={styles.card}
      style={{ '--city-color': cityColor(plan.city) }}
      data-selected={selected || undefined}
      data-status={plan.status}
      data-cover={plan.image_url ? '' : undefined}
    >
      <PlanCover url={plan.image_url} />
      <div className={styles.top}>
        <span className={styles.place}>
          <span className={`${styles.cityKanji} kanji`} aria-hidden="true">{city?.kanji}</span>
          {city?.label}
          {plan.zone && <span className={styles.zone}> · {plan.zone}</span>}
        </span>
        <Stamp status={plan.status} />
        {dragHandle && (
          <button type="button" className={styles.handle} {...dragHandle}>
            <Icon name="grip" size={18} />
          </button>
        )}
      </div>

      <h3 className={styles.title}>
        {/* El botón se estira sobre toda la tarjeta: un único elemento interactivo y accesible */}
        <button type="button" className={styles.open} onClick={() => onOpen(plan.id)} aria-current={selected || undefined}>
          {plan.title}
        </button>
      </h3>

      <div className={styles.meta}>
        <span className={styles.category}>
          <span className="kanji" aria-hidden="true">{category?.kanji}</span>
          {category?.short ?? category?.label}
        </span>
        {price && (
          <span className={styles.price}>
            {price.primary}
            {price.secondary && <span className={styles.secondary}>{price.secondary}</span>}
            {price.per === 'total' && <span className={styles.secondary}>total</span>}
          </span>
        )}
        {duration && (
          <span className={styles.duration}>
            <Icon name="clock" size={14} />
            {duration}
          </span>
        )}
      </div>

      <div className={styles.bottom}>
        <Avatars people={plan.attendees} size={22} />
        <div className={styles.quick}>
          <button
            type="button"
            className={styles.vote}
            aria-pressed={voted}
            aria-label={voted ? 'Quitar "me interesa"' : 'Me interesa'}
            disabled={readOnly}
            onClick={() => {
              haptic()
              onToggleVote(plan.id)
            }}
          >
            <Icon name="heart" size={16} filled={voted} />
            {plan.votes?.length > 0 && <span>{plan.votes.length}</span>}
          </button>
          <button
            type="button"
            className={styles.attend}
            aria-pressed={going}
            disabled={readOnly}
            onClick={() => {
              haptic()
              onToggleAttend(plan.id)
            }}
          >
            {going && <Icon name="check" size={14} />}
            {going ? 'Voy' : 'Me apunto'}
          </button>
        </div>
      </div>
    </article>
  )
}

/** El asa cambia de objeto en cada render; solo importan sus atributos (aria-pressed, tabIndex…). */
function sameHandle(a, b) {
  if (!a || !b) return a === b
  for (const key in a) {
    if (key !== 'ref' && typeof a[key] !== 'function' && a[key] !== b[key]) return false
  }
  return true
}

// Con 100+ planes, cambiar un filtro no debe volver a pintar las tarjetas que no cambian
export default memo(PlanCard, (prev, next) => {
  for (const key of ['plan', 'rate', 'me', 'selected', 'readOnly', 'onOpen', 'onToggleAttend', 'onToggleVote']) {
    if (prev[key] !== next[key]) return false
  }
  return sameHandle(prev.dragHandle, next.dragHandle)
})
