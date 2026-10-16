import Icon from '../ui/Icon.jsx'
import styles from './SearchBar.module.css'

/** `shortcut`: muestra la tecla que enfoca el buscador (solo en escritorio). */
export default function SearchBar({ value, onChange, shortcut }) {
  return (
    <div className={styles.search} role="search">
      <Icon name="search" size={18} className={styles.icon} />
      <label className="visually-hidden" htmlFor="plan-search">Buscar planes</label>
      <input
        id="plan-search"
        className={styles.input}
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        placeholder="Buscar ramen, templos, Shibuya…"
        value={value}
        aria-keyshortcuts={shortcut}
        onChange={(e) => onChange(e.target.value)}
      />
      {shortcut && !value && (
        <kbd className={styles.kbd} aria-hidden="true">
          {shortcut}
        </kbd>
      )}
      {value && (
        <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Borrar búsqueda">
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  )
}
