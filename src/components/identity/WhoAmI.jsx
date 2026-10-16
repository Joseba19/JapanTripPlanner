import { PEOPLE, personColor } from '../../lib/constants.js'
import { useIdentity } from '../../hooks/useIdentity.jsx'
import styles from './WhoAmI.module.css'

/** Primera pantalla en un dispositivo nuevo: elegir quién eres. */
export default function WhoAmI() {
  const { setMe } = useIdentity()
  return (
    <main className={styles.screen}>
      <div className={styles.inner}>
        <span className={`${styles.mark} kanji`} aria-hidden="true">旅</span>
        <h1 className={styles.title}>¿Quién eres?</h1>
        <p className={styles.text}>
          Se guarda en este dispositivo para saber quién crea y edita cada plan. Puedes cambiarlo luego en Ajustes.
        </p>
        <div className={styles.people}>
          {PEOPLE.map((name) => (
            <button
              key={name}
              type="button"
              className={styles.person}
              style={{ '--person-color': personColor(name) }}
              onClick={() => setMe(name)}
            >
              <span className={styles.initial} aria-hidden="true">{name[0]}</span>
              {name}
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
