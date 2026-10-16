import { CATEGORY_BY_ID, CITY_BY_ID, EVERYONE, LIMITS, OWNERS, PEOPLE, STATUS_BY_ID } from './constants.js'

/**
 * Lee un importe escrito a mano: "3.800" → 3800 (yenes), "18,50" → 18.5, "1.200,5" → 1200.5.
 * Devuelve null si está vacío y NaN si no es un número válido.
 */
export function parseAmount(input, currency) {
  const text = String(input ?? '').replace(/[\s¥€]/g, '')
  if (!text) return null
  if (!/^\d[\d.,]*$/.test(text)) return NaN

  let normalized
  if (currency === 'JPY') {
    // En yenes no hay céntimos: los puntos y las comas son separadores de miles
    normalized = text.replace(/[.,]/g, '')
  } else if (text.includes(',')) {
    normalized = text.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    normalized = text.replace(/\./g, '')
  } else {
    normalized = text
  }
  const value = Number(normalized)
  return Number.isFinite(value) ? value : NaN
}

export const defaultAttendees = (owner) => (owner === EVERYONE ? [...PEOPLE] : PEOPLE.includes(owner) ? [owner] : [])

export function emptyForm(me, { city = '' } = {}) {
  const owner = me || EVERYONE
  return {
    title: '',
    city,
    zone: '',
    location: '',
    price_amount: '',
    price_currency: 'JPY',
    price_per: 'persona',
    duration_min: null,
    category: '',
    notes: '',
    owner,
    attendees: defaultAttendees(owner),
    status: 'idea',
    image_url: '',
  }
}

export function planToForm(plan) {
  return {
    title: plan.title ?? '',
    city: plan.city ?? '',
    zone: plan.zone ?? '',
    location: plan.location ?? '',
    price_amount: plan.price_amount == null ? '' : String(plan.price_amount).replace('.', ','),
    price_currency: plan.price_currency ?? 'JPY',
    price_per: plan.price_per ?? 'persona',
    duration_min: plan.duration_min ?? null,
    category: plan.category ?? '',
    notes: plan.notes ?? '',
    owner: plan.owner ?? EVERYONE,
    attendees: plan.attendees ?? [],
    status: plan.status ?? 'idea',
    image_url: plan.image_url ?? '',
  }
}

const orNull = (text) => {
  const value = String(text ?? '').trim()
  return value === '' ? null : value
}

/** Formulario → fila de `plans` (solo campos editables). */
export function formToPlan(form) {
  const amount = parseAmount(form.price_amount, form.price_currency)
  return {
    title: form.title.trim(),
    city: form.city,
    zone: orNull(form.zone),
    location: orNull(form.location),
    price_amount: Number.isNaN(amount) ? null : amount,
    price_currency: form.price_currency,
    price_per: form.price_per,
    duration_min: form.duration_min,
    category: form.category,
    notes: orNull(form.notes),
    owner: form.owner,
    attendees: PEOPLE.filter((p) => form.attendees.includes(p)),
    status: form.status,
    image_url: orNull(form.image_url),
  }
}

/** Devuelve { campo: mensaje } con los errores; vacío si todo está bien. */
export function validateForm(form) {
  const errors = {}
  const title = form.title.trim()
  if (!title) errors.title = 'Ponle un título al plan.'
  else if (title.length > LIMITS.title) errors.title = `Máximo ${LIMITS.title} caracteres.`
  if (!CITY_BY_ID[form.city]) errors.city = 'Elige una ciudad.'
  if (!CATEGORY_BY_ID[form.category]) errors.category = 'Elige una categoría.'
  if (!STATUS_BY_ID[form.status]) errors.status = 'Estado no válido.'
  if (!OWNERS.includes(form.owner)) errors.owner = 'Elige a quién pertenece.'
  if (form.zone.trim().length > LIMITS.zone) errors.zone = `Máximo ${LIMITS.zone} caracteres.`
  if (form.location.trim().length > LIMITS.location) errors.location = `Máximo ${LIMITS.location} caracteres.`
  if (form.notes.trim().length > LIMITS.notes) errors.notes = `Máximo ${LIMITS.notes} caracteres.`

  const amount = parseAmount(form.price_amount, form.price_currency)
  if (Number.isNaN(amount)) errors.price_amount = 'Escribe solo números, por ejemplo 3.800 o 18,50.'
  else if (amount != null && amount >= 1e8) errors.price_amount = 'Ese precio parece demasiado alto.'

  const image = form.image_url.trim()
  if (image && !/^https:\/\/\S+$/i.test(image)) errors.image_url = 'Tiene que ser un enlace que empiece por https://'
  else if (image.length > LIMITS.imageUrl) errors.image_url = 'Ese enlace es demasiado largo.'

  const d = form.duration_min
  if (d != null && (!Number.isInteger(d) || d < 0 || d > 1440)) errors.duration_min = 'Entre 0 y 24 horas.'
  return errors
}
