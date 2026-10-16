import { CATEGORY_BY_ID, CITY_BY_ID, cityColor } from '../../lib/constants.js'
import { formatDuration, formatPrice } from '../../lib/format.js'
import Avatars from '../ui/Avatars.jsx'
import Icon from '../ui/Icon.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './PlanCard.module.css'
import PlanCover from './PlanCover.jsx'

/** `dragHandle`: props del asa cuando la lista se puede reordenar (orden del grupo). */
export default function PlanCard({ plan, rate, me, selected, onOpen, onToggleAttend, onToggleVote, dragHandle }) {
  const city = CITY_BY_ID[plan.city]
  const category = CATEGORY_BY_ID[plan.category]
  const price = formatPrice(plan, rate)
  const duration = formatDuration(plan.duration_min)
  const going = plan.attendees.includes(me)
  const voted = plan.votes?.includes(me)

  return (
    <article className={styles.card} style={{ '--city-color': cityColor(plan.city) }} data-selected={selected || undefined}>
      <PlanCover url={plan.image_url} />
      <div className={styles.top}>
        <span className={styles.place}>
          <span className={`${styles.cityKanji} kanji`} aria-hidden="true">{city?.kanji}</span>
          {city?.label}
          {plan.zone && <span className={styles.zone}> · {plan.zone}</span>}
        </span>
        <StatusBadge status={plan.status} />
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
            onClick={() => onToggleVote(plan.id)}
          >
            <Icon name="heart" size={16} filled={voted} />
            {plan.votes?.length > 0 && <span>{plan.votes.length}</span>}
          </button>
          <button type="button" className={styles.attend} aria-pressed={going} onClick={() => onToggleAttend(plan.id)}>
            {going && <Icon name="check" size={14} />}
            {going ? 'Voy' : 'Me apunto'}
          </button>
        </div>
      </div>
    </article>
  )
}
