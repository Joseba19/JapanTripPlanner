import styles from './Segmented.module.css'

/** Selector de una opción entre pocas (radio group visual). options: [{ id, label, kanji?, color? }] */
export default function Segmented({ options, value, onChange, label, id, describedBy, size = 'md' }) {
  return (
    <div className={styles.group} role="radiogroup" aria-label={label} id={id} aria-describedby={describedBy} data-size={size}>
      {options.map((option) => {
        const checked = option.id === value
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={checked}
            className={styles.option}
            style={option.color ? { '--seg-color': option.color } : undefined}
            onClick={() => onChange(option.id)}
          >
            {option.kanji && <span className="kanji" aria-hidden="true">{option.kanji}</span>}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
