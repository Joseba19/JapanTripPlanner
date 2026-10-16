import { CATEGORY_BY_ID, CITY_BY_ID, cityColor } from '../../lib/constants.js'
import { formatDuration, formatPrice } from '../../lib/format.js'
import Avatars from '../ui/Avatars.jsx'
import Icon from '../ui/Icon.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'
import styles from './PlanCard.module.css'

export default function PlanCard({ plan, rate, selected, onOpen }) {
  const city = CITY_BY_ID[plan.city]
  const category = CATEGORY_BY_ID[plan.category]
  const price = formatPrice(plan, rate)
  const duration = formatDuration(plan.duration_min)

  return (
    <article className={styles.card} style={{ '--city-color': cityColor(plan.city) }} data-selected={selected || undefined}>
      <div className={styles.top}>
        <span className={styles.place}>
          <span className={`${styles.cityKanji} kanji`} aria-hidden="true">{city?.kanji}</span>
          {city?.label}
          {plan.zone && <span className={styles.zone}> · {plan.zone}</span>}
        </span>
        <StatusBadge status={plan.status} />
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
        {plan.votes?.length > 0 && (
          <span className={styles.votes} aria-label={`${plan.votes.length} con mucho interés`}>
            <Icon name="heart" size={14} />
            {plan.votes.length}
          </span>
        )}
      </div>
    </article>
  )
}
