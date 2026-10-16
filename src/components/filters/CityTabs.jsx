import { CITIES, cityColor } from '../../lib/constants.js'
import styles from './CityTabs.module.css'

/** Selector de ciudad deslizable. `counts`: { tokio: 3, … , all: 10 } */
export default function CityTabs({ value, counts, onChange }) {
  const options = [{ id: '', label: 'Todas', kanji: '全' }, ...CITIES]
  return (
    <div className={styles.tabs} role="radiogroup" aria-label="Ciudad">
      {options.map((city) => {
        const checked = value === city.id
        return (
          <button
            key={city.id || 'all'}
            type="button"
            role="radio"
            aria-checked={checked}
            className={styles.tab}
            style={{ '--tab-color': city.id ? cityColor(city.id) : 'var(--text)' }}
            onClick={() => onChange(city.id)}
          >
            <span className={`${styles.kanji} kanji`} aria-hidden="true">{city.kanji}</span>
            <span className={styles.label}>
              {city.label}
              <span className={styles.count}>{counts[city.id || 'all'] ?? 0}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
