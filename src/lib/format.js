import { PEOPLE } from './constants.js'

const group = (digits) => String(digits).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export function formatYen(amount) {
  return `¥${group(Math.round(amount))}`
}

export function formatEur(amount) {
  const [int, dec] = (Math.round(amount * 100) / 100).toFixed(2).split('.')
  return dec === '00' ? `${group(int)} €` : `${group(int)},${dec} €`
}

/** Convierte a yenes. `rate` = yenes por 1 €. */
export function toJpy(amount, currency, rate) {
  return currency === 'EUR' ? amount * rate : amount
}

export function toEur(amount, currency, rate) {
  return currency === 'JPY' ? amount / rate : amount
}

/** Precio por persona en yenes; si el precio es "total" se reparte entre quienes se apuntan. */
export function perPersonJpy(plan, rate) {
  if (plan.price_amount == null) return null
  const jpy = toJpy(Number(plan.price_amount), plan.price_currency, rate)
  if (plan.price_per !== 'total') return jpy
  const people = plan.attendees?.length || PEOPLE.length
  return jpy / people
}

/** Texto del precio: { primary, secondary, per } o null si no hay precio. */
export function formatPrice(plan, rate) {
  if (plan.price_amount == null) return null
  const amount = Number(plan.price_amount)
  if (amount === 0) return { primary: 'Gratis', secondary: null, per: null }

  const isEur = plan.price_currency === 'EUR'
  const primary = isEur ? formatEur(amount) : formatYen(amount)
  let secondary = null
  if (rate > 0) {
    if (isEur) {
      secondary = `≈ ${formatYen(amount * rate)}`
    } else {
      const eur = amount / rate
      secondary = `≈ ${formatEur(eur >= 10 ? Math.round(eur) : Math.round(eur * 10) / 10)}`
    }
  }
  return { primary, secondary, per: plan.price_per === 'total' ? 'total' : 'por persona' }
}

export function formatDuration(minutes) {
  if (minutes == null) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m}` : `${h} h`
}

export const isUrl = (text) => /^https?:\/\//i.test(String(text ?? '').trim())

export function mapsUrl(location) {
  const value = String(location ?? '').trim()
  if (!value) return null
  if (isUrl(value)) return value
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function relativeTime(iso, now = Date.now()) {
  if (!iso) return ''
  const seconds = (new Date(iso).getTime() - now) / 1000
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return 'ahora mismo'
}
