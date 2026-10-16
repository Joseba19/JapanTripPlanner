import { useEffect, useState } from 'react'
import Button from '../components/ui/Button.jsx'
import PersonPicker from '../components/ui/PersonPicker.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useIdentity } from '../hooks/useIdentity.jsx'
import { PEOPLE } from '../lib/constants.js'
import { usePlans } from '../state/PlansProvider.jsx'
import styles from './SettingsPage.module.css'

export default function SettingsPage() {
  const { me, setMe } = useIdentity()
  const { plans, rate, setRate } = usePlans()
  const toast = useToast()
  const [rateInput, setRateInput] = useState(() => String(rate).replace('.', ','))
  const [savingRate, setSavingRate] = useState(false)

  // Si el tipo de cambio llega del servidor (o lo cambia otra persona), lo reflejamos
  useEffect(() => setRateInput(String(rate).replace('.', ',')), [rate])

  const parsedRate = Number(rateInput.replace(',', '.'))
  const rateValid = Number.isFinite(parsedRate) && parsedRate > 0 && parsedRate < 1000
  const rateChanged = rateValid && parsedRate !== rate

  const saveRate = async (event) => {
    event.preventDefault()
    if (!rateChanged) return
    setSavingRate(true)
    try {
      await setRate(parsedRate)
      toast.show({ message: `Tipo de cambio: 1 € = ${parsedRate} ¥` })
    } catch (error) {
      toast.error(`No se pudo guardar: ${error.message}`)
    } finally {
      setSavingRate(false)
    }
  }

  const exportJson = () => {
    const data = { exported_at: new Date().toISOString(), settings: { eur_jpy: rate }, plans }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `japon-planes-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Ajustes</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>¿Quién eres?</h2>
        <p className={styles.text}>Solo en este dispositivo. Se usa para la autoría de los cambios y para "Mis planes".</p>
        <PersonPicker label="Quién eres" options={PEOPLE} value={me} onChange={setMe} />
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Tipo de cambio</h2>
        <p className={styles.text}>Compartido por los cuatro. Se usa para convertir entre yenes y euros.</p>
        <form className={styles.rate} onSubmit={saveRate}>
          <label className={styles.rateLabel} htmlFor="rate">1 € =</label>
          <input
            id="rate"
            className={`input ${styles.rateInput}`}
            inputMode="decimal"
            value={rateInput}
            aria-invalid={!rateValid || undefined}
            onChange={(e) => setRateInput(e.target.value)}
          />
          <span className={styles.rateLabel}>¥</span>
          <Button type="submit" variant="primary" size="sm" loading={savingRate} disabled={!rateChanged}>
            Guardar
          </Button>
        </form>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>Copia de seguridad</h2>
        <p className={styles.text}>
          Descarga todos los planes ({plans.length}, archivados incluidos) en un archivo JSON. Conviene hacerlo de vez en
          cuando y antes del viaje.
        </p>
        <Button icon="download" onClick={exportJson} className={styles.export}>
          Exportar JSON
        </Button>
      </section>
    </div>
  )
}
