import { DURATION_PRESETS } from '../../lib/constants.js'
import Chip from './Chip.jsx'
import styles from './DurationPicker.module.css'

/** Duración en minutos (o null): atajos rápidos o horas y minutos exactos. */
export default function DurationPicker({ value, onChange, id, describedBy }) {
  const hours = value == null ? '' : Math.floor(value / 60)
  const minutes = value == null ? '' : value % 60

  const setPart = (part, raw) => {
    const n = raw === '' ? 0 : Math.max(0, Math.floor(Number(raw)) || 0)
    const h = part === 'h' ? n : Number(hours) || 0
    const m = part === 'm' ? n : Number(minutes) || 0
    const total = Math.min(1440, h * 60 + m)
    onChange(raw === '' && (part === 'h' ? !m : !h) ? null : total)
  }

  return (
    <div className={styles.wrap} id={id} aria-describedby={describedBy}>
      <div className={styles.presets} role="group" aria-label="Duraciones rápidas">
        {DURATION_PRESETS.map((preset) => (
          <Chip
            key={preset.minutes}
            selected={value === preset.minutes}
            onClick={() => onChange(value === preset.minutes ? null : preset.minutes)}
          >
            {preset.label}
          </Chip>
        ))}
      </div>
      <div className={styles.exact}>
        <span className={styles.or}>o exacto</span>
        <label className={styles.part}>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            max="24"
            value={hours}
            placeholder="0"
            onChange={(e) => setPart('h', e.target.value)}
          />
          <span>h</span>
        </label>
        <label className={styles.part}>
          <input
            className="input"
            type="number"
            inputMode="numeric"
            min="0"
            max="59"
            step="5"
            value={minutes}
            placeholder="0"
            onChange={(e) => setPart('m', e.target.value)}
          />
          <span>min</span>
        </label>
      </div>
    </div>
  )
}
