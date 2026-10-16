import { CATEGORY_BY_ID, CITY_BY_ID, PEOPLE, SORT_IDS, STATUS_BY_ID } from './constants.js'

// Los filtros viven en la URL (?city=kioto&st=idea,confirmado) para poder compartirlos.
const KEYS = { q: 'q', city: 'city', categories: 'cat', statuses: 'st', people: 'who', mine: 'mine', priceMax: 'pmax', durationMax: 'dmax' }

export function parseFilters(params) {
  const list = (key) => (params.get(key) || '').split(',').filter(Boolean)
  const num = (key) => {
    const raw = params.get(key)
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : null
  }
  const city = params.get(KEYS.city)
  return {
    q: params.get(KEYS.q) || '',
    city: CITY_BY_ID[city] ? city : '',
    categories: list(KEYS.categories).filter((id) => CATEGORY_BY_ID[id]),
    statuses: list(KEYS.statuses).filter((id) => STATUS_BY_ID[id]),
    people: list(KEYS.people).filter((name) => PEOPLE.includes(name)),
    mine: params.get(KEYS.mine) === '1',
    priceMax: num(KEYS.priceMax),
    durationMax: num(KEYS.durationMax),
  }
}

/** Escribe los filtros en `params` (lo modifica) y quita los que están vacíos. */
export function writeFilters(params, filters) {
  const set = (key, value) => (value === '' || value == null ? params.delete(key) : params.set(key, String(value)))
  set(KEYS.q, filters.q)
  set(KEYS.city, filters.city)
  set(KEYS.categories, filters.categories.join(','))
  set(KEYS.statuses, filters.statuses.join(','))
  set(KEYS.people, filters.people.join(','))
  set(KEYS.mine, filters.mine ? '1' : '')
  set(KEYS.priceMax, filters.priceMax)
  set(KEYS.durationMax, filters.durationMax)
  return params
}

export function parseSort(params) {
  const sort = params.get('sort')
  return SORT_IDS.includes(sort) ? sort : 'manual'
}
