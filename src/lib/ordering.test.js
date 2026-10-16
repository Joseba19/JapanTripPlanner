import { describe, expect, it } from 'vitest'
import { keyForTop, positionForMove } from './ordering.js'
import { byPosition } from './search.js'

const plan = (id, position) => ({ id, position, created_at: '2026-10-01T00:00:00Z' })
const order = (plans) => [...plans].sort(byPosition).map((p) => p.id)

/** Simula soltar el plan visible `from` en `to` y devuelve el orden completo resultante. */
function drop(all, visibleIds, from, to) {
  const visible = order(all).filter((id) => visibleIds.includes(id)).map((id) => all.find((p) => p.id === id))
  const key = positionForMove(all, visible, from, to)
  return all.map((p) => (p.id === visible[from].id ? { ...p, position: key } : p))
}

describe('keyForTop', () => {
  it('lista vacía', () => {
    expect(keyForTop([])).toBe('a0')
  })
  it('queda antes que todas las demás', () => {
    expect(keyForTop([{ position: 'a3' }, { position: 'a0' }, { position: 'a1' }]) < 'a0').toBe(true)
  })
  it('se puede repetir muchas veces sin chocar', () => {
    const plans = []
    for (let i = 0; i < 200; i++) plans.push({ position: keyForTop(plans) })
    const keys = plans.map((p) => p.position)
    expect(new Set(keys).size).toBe(200)
    expect([...keys].sort()).toEqual([...keys].reverse())
  })
})

describe('positionForMove', () => {
  const all = ['A', 'B', 'C', 'D', 'E'].map((id, i) => plan(id, `a${i}`))
  const ids = all.map((p) => p.id)

  it('bajar, subir, al principio y al final', () => {
    expect(order(drop(all, ids, 0, 2))).toEqual(['B', 'C', 'A', 'D', 'E'])
    expect(order(drop(all, ids, 3, 1))).toEqual(['A', 'D', 'B', 'C', 'E'])
    expect(order(drop(all, ids, 4, 0))).toEqual(['E', 'A', 'B', 'C', 'D'])
    expect(order(drop(all, ids, 0, 4))).toEqual(['B', 'C', 'D', 'E', 'A'])
  })

  it('soltar en el mismo sitio no cambia nada', () => {
    expect(positionForMove(all, all, 2, 2)).toBeNull()
  })

  it('con filtro, los planes ocultos no se mueven de sitio relativo', () => {
    // Visibles: A, C, E. Subir E encima de C → E queda justo detrás de A, delante de B (oculto)
    expect(order(drop(all, ['A', 'C', 'E'], 2, 1))).toEqual(['A', 'E', 'B', 'C', 'D'])
    // Bajar A al final de los visibles → justo detrás de E
    expect(order(drop(all, ['A', 'C', 'E'], 0, 2))).toEqual(['B', 'C', 'D', 'E', 'A'])
    // Subir C arriba del todo → justo delante de A
    expect(order(drop(all, ['A', 'C', 'E'], 1, 0))).toEqual(['C', 'A', 'B', 'D', 'E'])
  })

  it('aguanta claves repetidas (dos altas a la vez)', () => {
    const dupes = [plan('X', 'Zz'), plan('Y', 'Zz'), plan('A', 'a0'), plan('B', 'a1')]
    const visible = [...dupes].sort(byPosition)
    expect(() => positionForMove(dupes, visible, 3, 1)).not.toThrow()
    const result = drop(dupes, dupes.map((p) => p.id), 3, 1)
    expect(order(result).indexOf('B')).toBeLessThan(order(result).indexOf('A'))
  })

  it('muchos movimientos seguidos mantienen un orden válido', () => {
    let list = all
    for (let i = 0; i < 100; i++) list = drop(list, ids, i % 5, (i * 3) % 5 === i % 5 ? (i + 1) % 5 : (i * 3) % 5)
    expect(new Set(list.map((p) => p.position)).size).toBe(5)
    expect(order(list)).toHaveLength(5)
  })
})
