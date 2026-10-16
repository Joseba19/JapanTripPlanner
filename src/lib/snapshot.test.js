import { describe, expect, it } from 'vitest'
import { parseSnapshot } from './snapshot.js'

describe('parseSnapshot', () => {
  it('acepta una copia válida', () => {
    const plans = [{ id: 'a' }]
    expect(parseSnapshot({ v: 1, plans, rate: 160, savedAt: 123 })).toEqual({ plans, rate: 160, savedAt: 123 })
  })

  it('el tipo de cambio es opcional', () => {
    expect(parseSnapshot({ v: 1, plans: [], savedAt: 1 }).rate).toBeNull()
  })

  it('descarta copias vacías, de otra versión o mal formadas', () => {
    expect(parseSnapshot(null)).toBeNull()
    expect(parseSnapshot({ v: 0, plans: [], savedAt: 1 })).toBeNull()
    expect(parseSnapshot({ v: 1, plans: 'x', savedAt: 1 })).toBeNull()
    expect(parseSnapshot({ v: 1, plans: [] })).toBeNull()
  })
})
