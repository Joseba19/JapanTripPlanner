import { CATEGORY_BY_ID, CITY_BY_ID, cityColor, STATUSES, statusColor } from '../../lib/constants.js'
import { formatDuration, formatPrice, isUrl, mapsUrl, relativeTime } from '../../lib/format.js'
import { Avatar } from '../ui/Avatars.jsx'
import Button from '../ui/Button.jsx'
import { haptic } from '../../lib/motion.js'
import Icon from '../ui/Icon.jsx'
import Stamp from '../ui/Stamp.jsx'
import Segmented from '../ui/Segmented.jsx'
import styles from './PlanDetail.module.css'
import PlanCover from './PlanCover.jsx'
import PlanHistory from './PlanHistory.jsx'

/** `readOnly`: sin conexión se puede consultar todo, pero no cambiar nada. */
export default function PlanDetail({ plan, rate, me, readOnly, onEdit, onArchive, onRestore, onStatus, onToggleAttend, onToggleVote }) {
  const city = CITY_BY_ID[plan.city]
  const category = CATEGORY_BY_ID[plan.category]
  const price = formatPrice(plan, rate)
  const duration = formatDuration(plan.duration_min)
  const maps = mapsUrl(plan.location)
  const archived = Boolean(plan.archived_at)
  const going = plan.attendees.includes(me)
  const voted = plan.votes.includes(me)

  return (
    <article className={styles.detail} style={{ '--city-color': cityColor(plan.city) }}>
      <PlanCover url={plan.image_url} variant="hero" />

      {archived && (
        <div className={styles.archived} role="note">
          <span>Archivado por {plan.archived_by ?? 'alguien'} {relativeTime(plan.archived_at)}</span>
          <Button size="sm" icon="restore" onClick={onRestore} disabled={readOnly}>Restaurar</Button>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.headerTop}>
          <p className={styles.place}>
            <span className={`${styles.cityKanji} kanji`} aria-hidden="true">{city?.kanji}</span>
            {city?.label}
            {plan.zone && <span className={styles.zone}> · {plan.zone}</span>}
          </p>
          <Stamp status={plan.status} size="lg" />
        </div>
        <h2 className={styles.title}>{plan.title}</h2>
      </header>

      {!archived && (
        <div className={styles.quick}>
          <button type="button" className={styles.attend} aria-pressed={going} disabled={readOnly} onClick={() => (haptic(), onToggleAttend())}>
            <Icon name={going ? 'check' : 'plus'} size={18} />
            {going ? 'Voy' : 'Me apunto'}
          </button>
          <button type="button" className={styles.vote} aria-pressed={voted} disabled={readOnly} onClick={() => (haptic(), onToggleVote())}>
            <Icon name="heart" size={18} filled={voted} />
            Me interesa
            {plan.votes.length > 0 && <span className={styles.voteCount}>{plan.votes.length}</span>}
          </button>
        </div>
      )}

      <Segmented
        label="Estado"
        options={STATUSES.map((s) => ({ ...s, color: statusColor(s.id) }))}
        value={plan.status}
        disabled={readOnly}
        onChange={(status) => status !== plan.status && onStatus(status)}
      />

      <dl className={styles.facts}>
        <div>
          <dt>Precio</dt>
          <dd>
            {price ? (
              <>
                <span className={styles.big}>{price.primary}</span>
                {price.secondary && <span className={styles.dim}>{price.secondary}</span>}
                {price.per && <span className={styles.dim}>{price.per}</span>}
              </>
            ) : (
              <span className={styles.dim}>Sin precio</span>
            )}
          </dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{duration ? <span className={styles.big}>{duration}</span> : <span className={styles.dim}>Sin definir</span>}</dd>
        </div>
        <div>
          <dt>Categoría</dt>
          <dd>
            <span className={`${styles.catKanji} kanji`} aria-hidden="true">{category?.kanji}</span>
            {category?.label}
          </dd>
        </div>
        <div>
          <dt>De</dt>
          <dd className={styles.owner}>
            <Avatar name={plan.owner} size={22} />
            {plan.owner}
          </dd>
        </div>
      </dl>

      {plan.location && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Dónde</h3>
          {!isUrl(plan.location) && <p className={styles.location}>{plan.location}</p>}
          <a className={styles.maps} href={maps} target="_blank" rel="noreferrer">
            <Icon name="pin" size={18} />
            Abrir en Google Maps
            <Icon name="external" size={14} />
          </a>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Se apuntan · {plan.attendees.length}</h3>
        {plan.attendees.length ? (
          <ul className={styles.people}>
            {plan.attendees.map((name) => (
              <li key={name}>
                <Avatar name={name} size={26} />
                {name}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.dim}>Todavía nadie.</p>
        )}
        {plan.votes.length > 0 && (
          <p className={styles.dim}>
            <Icon name="heart" size={14} filled className={styles.inlineHeart} /> Les interesa mucho: {plan.votes.join(', ')}
          </p>
        )}
      </section>

      {plan.notes && (
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Notas</h3>
          <p className={styles.notes}>{plan.notes}</p>
        </section>
      )}

      <p className={styles.audit}>
        Creado por {plan.created_by ?? '—'} {relativeTime(plan.created_at)}
        {plan.updated_by && plan.updated_at !== plan.created_at && (
          <> · editado por {plan.updated_by} {relativeTime(plan.updated_at)}</>
        )}
      </p>

      {!archived && (
        <div className={styles.actions}>
          <Button variant="primary" icon="edit" onClick={onEdit} disabled={readOnly}>Editar</Button>
          <Button variant="ghost" icon="archive" onClick={onArchive} disabled={readOnly}>Archivar</Button>
        </div>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Historial</h3>
        <PlanHistory planId={plan.id} version={plan.updated_at} />
      </section>
    </article>
  )
}
