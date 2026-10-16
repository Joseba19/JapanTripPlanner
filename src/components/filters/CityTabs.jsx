import { CITIES, cityColor } from '../../lib/constants.js'
import styles from './CityTabs.module.css'

/** Pincelada irregular que se "pinta" con stroke-dashoffset (barato: un solo trazo SVG). */
export function BrushStroke({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      <path d="M2 6.5 C 18 3.5, 34 7.5, 52 5.2 S 84 3.6, 98 5.8" pathLength="1" />
    </svg>
  )
}

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
            <BrushStroke className={styles.brush} />
          </button>
        )
      })}
    </div>
  )
}
