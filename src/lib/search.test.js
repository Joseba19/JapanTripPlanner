import { describe, expect, it } from 'vitest'
import { countActiveFilters, EMPTY_FILTERS, filterPlans, matchesQuery, normalize, sortPlans } from './search.js'

const make = (id, overrides) => ({
  id,
  title: id,
  city: 'tokio',
  zone: null,
  notes: null,
  location: null,
  category: 'otros',
  owner: 'Todos',
  attendees: [],
  votes: [],
  status: 'idea',
  price_amount: null,
  price_currency: 'JPY',
  price_per: 'persona',
  duration_min: null,
  position: 'a0',
  created_at: '2026-10-01T00:00:00Z',
  ...overrides,
})

const plans = [
  make('fushimi', { title: 'Fushimi Inari', city: 'kioto', category: 'templos', status: 'confirmado', price_amount: 0, duration_min: 180, attendees: ['Joseba', 'Filip'], position: 'a2' }),
  make('teamlab', { title: 'teamLab Planets', zone: 'Toyosu', category: 'experiencias', price_amount: 3800, duration_min: 120, attendees: ['Filip'], votes: ['Filip', 'Ander'], position: 'a0' }),
  make('golden', { title: 'Golden Gai', zone: 'Shinjuku', category: 'noche', owner: 'Joseba', price_amount: 25, price_currency: 'EUR', duration_min: 150, position: 'a1', created_at: '2026-10-05T00:00:00Z' }),
  make('bambu', { title: 'Bosque de bambú', city: 'kioto', category: 'naturaleza', notes: 'Ir temprano', position: 'a3', votes: ['Joseba'] }),
]

const f = (overrides) => ({ ...EMPTY_FILTERS, ...overrides })
const ids = (list) => list.map((p) => p.id)

describe('normalize / matchesQuery', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalize('Bambú ÁRBOL')).toBe('bambu arbol')
    expect(matchesQuery(plans[3], 'BAMBU')).toBe(true)
  })
  it('busca en zona, notas, ciudad y categoría', () => {
    expect(matchesQuery(plans[1], 'toyosu')).toBe(true)
    expect(matchesQuery(plans[3], 'temprano')).toBe(true)
    expect(matchesQuery(plans[0], 'kioto templos')).toBe(true)
    expect(matchesQuery(plans[0], 'kioto noche')).toBe(false)
  })
})

describe('filterPlans', () => {
  it('sin filtros devuelve todo', () => {
    expect(filterPlans(plans, EMPTY_FILTERS)).toHaveLength(4)
  })
  it('combina ciudad, categoría y estado', () => {
    expect(ids(filterPlans(plans, f({ city: 'kioto' })))).toEqual(['fushimi', 'bambu'])
    expect(ids(filterPlans(plans, f({ city: 'kioto', statuses: ['confirmado'] })))).toEqual(['fushimi'])
    expect(ids(filterPlans(plans, f({ categories: ['noche', 'naturaleza'] })))).toEqual(['golden', 'bambu'])
  })
  it('filtra por quién se apunta y "mis planes"', () => {
    expect(ids(filterPlans(plans, f({ people: ['Filip'] })))).toEqual(['fushimi', 'teamlab'])
    expect(ids(filterPlans(plans, f({ mine: true }), { me: 'Joseba' }))).toEqual(['fushimi', 'golden'])
  })
  it('filtra por precio por persona en yenes (convirtiendo euros)', () => {
    expect(ids(filterPlans(plans, f({ priceMax: 0 }), { rate: 165 }))).toEqual(['fushimi'])
    expect(ids(filterPlans(plans, f({ priceMax: 5000 }), { rate: 165 }))).toEqual(['fushimi', 'teamlab', 'golden'])
    expect(ids(filterPlans(plans, f({ priceMax: 4000 }), { rate: 165 }))).toEqual(['fushimi', 'teamlab'])
  })
  it('filtra por duración máxima', () => {
    expect(ids(filterPlans(plans, f({ durationMax: 120 })))).toEqual(['teamlab'])
  })
  it('cuenta los filtros activos', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
    expect(countActiveFilters(f({ q: 'x', city: 'kioto' }))).toBe(0)
    expect(countActiveFilters(f({ categories: ['noche', 'comida'], mine: true, priceMax: 0 }))).toBe(4)
  })
})

describe('sortPlans', () => {
  it('orden manual por posición', () => {
    expect(ids(sortPlans(plans, 'manual'))).toEqual(['teamlab', 'golden', 'fushimi', 'bambu'])
  })
  it('por interés, desempatando por posición', () => {
    expect(ids(sortPlans(plans, 'interes'))).toEqual(['teamlab', 'bambu', 'golden', 'fushimi'])
  })
  it('por precio con los que no tienen precio al final', () => {
    expect(ids(sortPlans(plans, 'precio', 165))).toEqual(['fushimi', 'teamlab', 'golden', 'bambu'])
  })
  it('por duración y recientes', () => {
    expect(ids(sortPlans(plans, 'duracion'))).toEqual(['teamlab', 'golden', 'fushimi', 'bambu'])
    expect(ids(sortPlans(plans, 'recientes'))[0]).toBe('golden')
  })
  it('no modifica la lista original', () => {
    const copy = [...plans]
    sortPlans(plans, 'precio', 165)
    expect(plans).toEqual(copy)
  })
})
