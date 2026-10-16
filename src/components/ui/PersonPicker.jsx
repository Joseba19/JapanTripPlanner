import { personColor } from '../../lib/constants.js'
import { Avatar } from './Avatars.jsx'
import styles from './PersonPicker.module.css'

/**
 * Elegir personas. `multiple`: value es un array (quién se apunta); si no, un nombre (dueño).
 */
export default function PersonPicker({ options, value, onChange, multiple = false, label, id, describedBy }) {
  const isSelected = (name) => (multiple ? value.includes(name) : value === name)

  const toggle = (name) => {
    if (!multiple) return onChange(name)
    onChange(isSelected(name) ? value.filter((n) => n !== name) : [...value, name])
  }

  return (
    <div
      className={styles.group}
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={label}
      id={id}
      aria-describedby={describedBy}
    >
      {options.map((name) => (
        <button
          key={name}
          type="button"
          className={styles.person}
          style={{ '--person-color': personColor(name) }}
          role={multiple ? undefined : 'radio'}
          aria-checked={multiple ? undefined : isSelected(name)}
          aria-pressed={multiple ? isSelected(name) : undefined}
          onClick={() => toggle(name)}
        >
          <Avatar name={name} size={26} />
          <span>{name}</span>
        </button>
      ))}
    </div>
  )
}
