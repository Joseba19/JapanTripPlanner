import {
  CATEGORIES,
  DURATION_FILTERS,
  PEOPLE,
  personColor,
  PRICE_FILTERS,
  STATUSES,
  statusColor,
} from '../../lib/constants.js'
import Chip from '../ui/Chip.jsx'
import styles from './FilterPanel.module.css'

const toggleIn = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

/** Todos los filtros salvo búsqueda y ciudad. En móvil va dentro de un Sheet; en escritorio, en la barra lateral. */
export default function FilterPanel({ filters, onChange, onClear, activeCount, me }) {
  return (
    <div className={styles.panel}>
      <section className={styles.group}>
        <h3 className={styles.title}>Estado</h3>
        <div className={styles.chips}>
          {STATUSES.map((s) => (
            <Chip
              key={s.id}
              kanji={s.kanji}
              color={statusColor(s.id)}
              selected={filters.statuses.includes(s.id)}
              onClick={() => onChange({ statuses: toggleIn(filters.statuses, s.id) })}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.title}>Categoría</h3>
        <div className={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              kanji={c.kanji}
              color="var(--gold)"
              selected={filters.categories.includes(c.id)}
              onClick={() => onChange({ categories: toggleIn(filters.categories, c.id) })}
            >
              {c.short ?? c.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.title}>Quién va</h3>
        <div className={styles.chips}>
          {me && (
            <Chip selected={filters.mine} color={personColor(me)} onClick={() => onChange({ mine: !filters.mine })}>
              Mis planes
            </Chip>
          )}
          {PEOPLE.map((name) => (
            <Chip
              key={name}
              color={personColor(name)}
              selected={filters.people.includes(name)}
              onClick={() => onChange({ people: toggleIn(filters.people, name) })}
            >
              {name}
            </Chip>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.title}>Precio por persona</h3>
        <div className={styles.chips}>
          {PRICE_FILTERS.map((p) => (
            <Chip
              key={p.value}
              selected={filters.priceMax === p.value}
              onClick={() => onChange({ priceMax: filters.priceMax === p.value ? null : p.value })}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.title}>Duración</h3>
        <div className={styles.chips}>
          {DURATION_FILTERS.map((d) => (
            <Chip
              key={d.value}
              selected={filters.durationMax === d.value}
              onClick={() => onChange({ durationMax: filters.durationMax === d.value ? null : d.value })}
            >
              {d.label}
            </Chip>
          ))}
        </div>
      </section>

      {activeCount > 0 && (
        <button type="button" className={styles.clear} onClick={onClear}>
          Quitar filtros ({activeCount})
        </button>
      )}
    </div>
  )
}
