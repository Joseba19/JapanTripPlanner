import { SORTS } from '../../lib/constants.js'
import styles from './SortMenu.module.css'

export default function SortMenu({ value, onChange }) {
  return (
    <label className={styles.sort}>
      <span className="visually-hidden">Ordenar por</span>
      <select className={styles.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {SORTS.map((sort) => (
          <option key={sort.id} value={sort.id}>
            {sort.label}
          </option>
        ))}
      </select>
    </label>
  )
}
