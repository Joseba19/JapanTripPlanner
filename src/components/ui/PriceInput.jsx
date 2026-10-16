import { CURRENCIES } from '../../lib/constants.js'
import { formatPrice } from '../../lib/format.js'
import { parseAmount } from '../../lib/planValues.js'
import Segmented from './Segmented.jsx'
import styles from './PriceInput.module.css'

const PER_OPTIONS = [
  { id: 'persona', label: 'Por persona' },
  { id: 'total', label: 'Total' },
]

/** Importe + moneda + "por persona / total", con la conversión a la otra moneda en vivo. */
export default function PriceInput({ amount, currency, per, rate, onChange, id, describedBy, invalid }) {
  const symbol = CURRENCIES.find((c) => c.id === currency)?.symbol
  const parsed = parseAmount(amount, currency)
  const preview = parsed == null || Number.isNaN(parsed) ? null : formatPrice({ price_amount: parsed, price_currency: currency, price_per: per }, rate)

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <div className={styles.amount}>
          <span className={styles.symbol} aria-hidden="true">{symbol}</span>
          <input
            id={id}
            className="input"
            inputMode="decimal"
            autoComplete="off"
            placeholder={currency === 'JPY' ? '3.800' : '25'}
            value={amount}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => onChange({ price_amount: e.target.value })}
          />
        </div>
        <Segmented
          label="Moneda"
          options={CURRENCIES.map((c) => ({ id: c.id, label: c.symbol }))}
          value={currency}
          onChange={(value) => onChange({ price_currency: value })}
        />
      </div>
      <div className={styles.row}>
        <Segmented label="El precio es" size="sm" options={PER_OPTIONS} value={per} onChange={(value) => onChange({ price_per: value })} />
        <span className={styles.preview} aria-live="polite">
          {preview?.secondary ?? (preview?.primary === 'Gratis' ? 'Gratis' : 'Vacío = sin precio · 0 = gratis')}
        </span>
      </div>
    </div>
  )
}
