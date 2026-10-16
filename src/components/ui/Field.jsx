import { useId } from 'react'
import styles from './Field.module.css'

/**
 * Etiqueta + control + ayuda/error. `children` recibe { id, describedBy, invalid }
 * para enlazar el control con su etiqueta y su mensaje.
 */
export default function Field({ label, hint, error, optional, as = 'div', children }) {
  const id = useId()
  const messageId = `${id}-msg`
  const Wrapper = as
  const message = error || hint
  return (
    <Wrapper className={styles.field}>
      {as === 'fieldset' ? (
        <legend className={styles.label}>
          {label}
          {optional && <span className={styles.optional}>opcional</span>}
        </legend>
      ) : (
        <label className={styles.label} htmlFor={id}>
          {label}
          {optional && <span className={styles.optional}>opcional</span>}
        </label>
      )}
      {children({ id, describedBy: message ? messageId : undefined, invalid: Boolean(error) })}
      {message && (
        <p id={messageId} className={error ? styles.error : styles.hint}>
          {message}
        </p>
      )}
    </Wrapper>
  )
}
