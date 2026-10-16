import { describe, expect, it } from 'vitest'
import { keyForTop } from './ordering.js'

describe('keyForTop', () => {
  it('lista vacía', () => {
    expect(keyForTop([])).toBe('a0')
  })
  it('queda antes que todas las demás', () => {
    const plans = [{ position: 'a3' }, { position: 'a0' }, { position: 'a1' }]
    const key = keyForTop(plans)
    expect(key < 'a0').toBe(true)
  })
  it('se puede repetir muchas veces sin chocar', () => {
    const plans = []
    for (let i = 0; i < 200; i++) plans.push({ position: keyForTop(plans) })
    const keys = plans.map((p) => p.position)
    expect(new Set(keys).size).toBe(200)
    expect([...keys].sort()).toEqual([...keys].reverse())
  })
})
