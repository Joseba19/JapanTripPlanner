import { CATEGORY_BY_ID, CITY_BY_ID } from './constants.js'
import { perPersonJpy } from './format.js'

/** Minúsculas y sin tildes: "Kiyomizu-dera" y "kiyomizú" coinciden. */
export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function haystack(plan) {
  return normalize(
    [
      plan.title,
      plan.zone,
      plan.notes,
      plan.location,
      CITY_BY_ID[plan.city]?.label,
      CATEGORY_BY_ID[plan.category]?.label,
      plan.owner,
    ]
      .filter(Boolean)
      .join(' '),
  )
}

/** Todas las palabras de la búsqueda deben aparecer en algún campo. */
export function matchesQuery(plan, query) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean)
  if (!tokens.length) return true
  const text = haystack(plan)
  return tokens.every((token) => text.includes(token))
}

export const EMPTY_FILTERS = Object.freeze({
  q: '',
  city: '',
  categories: [],
  statuses: [],
  people: [],
  mine: false,
  priceMax: null,
  durationMax: null,
})

export function filterPlans(plans, filters, { me, rate } = {}) {
  return plans.filter((plan) => {
    if (filters.city && plan.city !== filters.city) return false
    if (filters.categories.length && !filters.categories.includes(plan.category)) return false
    if (filters.statuses.length && !filters.statuses.includes(plan.status)) return false
    if (filters.people.length && !filters.people.some((p) => plan.attendees?.includes(p))) return false
    if (filters.mine && me && plan.owner !== me && !plan.attendees?.includes(me)) return false
    if (filters.priceMax != null) {
      const price = perPersonJpy(plan, rate)
      if (price == null || price > filters.priceMax) return false
    }
    if (filters.durationMax != null) {
      if (plan.duration_min == null || plan.duration_min > filters.durationMax) return false
    }
    return matchesQuery(plan, filters.q)
  })
}

/** Número de filtros activos, sin contar la búsqueda ni la ciudad (que se ven siempre). */
export function countActiveFilters(filters) {
  return (
    filters.categories.length +
    filters.statuses.length +
    filters.people.length +
    (filters.mine ? 1 : 0) +
    (filters.priceMax != null ? 1 : 0) +
    (filters.durationMax != null ? 1 : 0)
  )
}

export function byPosition(a, b) {
  if (a.position < b.position) return -1
  if (a.position > b.position) return 1
  return a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
}

/** Ordena con los valores nulos al final y desempata por el orden del grupo. */
function nullsLast(getValue, direction = 1) {
  return (a, b) => {
    const va = getValue(a)
    const vb = getValue(b)
    if (va == null && vb == null) return byPosition(a, b)
    if (va == null) return 1
    if (vb == null) return -1
    return (va - vb) * direction || byPosition(a, b)
  }
}

export function sortPlans(plans, sort, rate) {
  const list = [...plans]
  switch (sort) {
    case 'interes':
      return list.sort((a, b) => (b.votes?.length ?? 0) - (a.votes?.length ?? 0) || byPosition(a, b))
    case 'precio':
      return list.sort(nullsLast((p) => perPersonJpy(p, rate)))
    case 'duracion':
      return list.sort(nullsLast((p) => p.duration_min))
    case 'recientes':
      return list.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0))
    default:
      return list.sort(byPosition)
  }
}
