import { CATEGORY_BY_ID, DURATION_FILTERS, PRICE_FILTERS, STATUS_BY_ID } from '../../lib/constants.js'
import Icon from '../ui/Icon.jsx'
import styles from './FilterChips.module.css'

/** Filtros activos como etiquetas que se quitan con un toque. */
export default function FilterChips({ filters, onChange, onClear }) {
  const items = [
    ...filters.statuses.map((id) => ({
      key: `st-${id}`,
      label: STATUS_BY_ID[id].label,
      remove: () => onChange({ statuses: filters.statuses.filter((v) => v !== id) }),
    })),
    ...filters.categories.map((id) => ({
      key: `cat-${id}`,
      label: CATEGORY_BY_ID[id].short ?? CATEGORY_BY_ID[id].label,
      remove: () => onChange({ categories: filters.categories.filter((v) => v !== id) }),
    })),
    ...(filters.mine ? [{ key: 'mine', label: 'Mis planes', remove: () => onChange({ mine: false }) }] : []),
    ...filters.people.map((name) => ({
      key: `who-${name}`,
      label: `Va ${name}`,
      remove: () => onChange({ people: filters.people.filter((v) => v !== name) }),
    })),
    ...(filters.priceMax != null
      ? [{
          key: 'price',
          label: PRICE_FILTERS.find((p) => p.value === filters.priceMax)?.label ?? `≤ ¥${filters.priceMax}`,
          remove: () => onChange({ priceMax: null }),
        }]
      : []),
    ...(filters.durationMax != null
      ? [{
          key: 'duration',
          label: DURATION_FILTERS.find((d) => d.value === filters.durationMax)?.label ?? `≤ ${filters.durationMax} min`,
          remove: () => onChange({ durationMax: null }),
        }]
      : []),
  ]

  if (!items.length) return null

  return (
    <div className={styles.row}>
      {items.map((item) => (
        <button key={item.key} type="button" className={styles.chip} onClick={item.remove} aria-label={`Quitar filtro ${item.label}`}>
          {item.label}
          <Icon name="close" size={14} />
        </button>
      ))}
      {items.length > 1 && (
        <button type="button" className={styles.clear} onClick={onClear}>
          Limpiar
        </button>
      )}
    </div>
  )
}
