import { describe, expect, it } from 'vitest'
import { parseFilters, parseSort, writeFilters } from './filterParams.js'
import { EMPTY_FILTERS } from './search.js'

describe('filtros en la URL', () => {
  it('lee y descarta valores no válidos', () => {
    const params = new URLSearchParams('city=paris&cat=comida,xxx&who=Filip,Pepe&pmax=abc&dmax=120&mine=1')
    expect(parseFilters(params)).toEqual({
      ...EMPTY_FILTERS,
      categories: ['comida'],
      people: ['Filip'],
      mine: true,
      durationMax: 120,
    })
  })
  it('ida y vuelta sin perder nada', () => {
    const filters = { ...EMPTY_FILTERS, q: 'ramen', city: 'osaka', statuses: ['idea', 'hecho'], priceMax: 0 }
    const params = writeFilters(new URLSearchParams('sort=precio&plan=123'), filters)
    expect(parseFilters(params)).toEqual(filters)
    expect(params.get('plan')).toBe('123')
    expect(params.get('cat')).toBeNull()
  })
  it('orden por defecto manual', () => {
    expect(parseSort(new URLSearchParams(''))).toBe('manual')
    expect(parseSort(new URLSearchParams('sort=precio'))).toBe('precio')
    expect(parseSort(new URLSearchParams('sort=nope'))).toBe('manual')
  })
})
