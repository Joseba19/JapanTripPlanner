import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CATEGORIES, CITIES, OWNERS, PEOPLE, STATUSES } from './constants.js'

// Las listas del cliente deben coincidir con los CHECK de la base de datos
const schema = readFileSync(new URL('../../supabase/migrations/001_schema.sql', import.meta.url), 'utf8')

describe('constantes ↔ esquema SQL', () => {
  it.each([
    ['ciudades', CITIES.map((c) => c.id)],
    ['categorías', CATEGORIES.map((c) => c.id)],
    ['estados', STATUSES.map((s) => s.id)],
    ['dueños', OWNERS],
    ['personas', PEOPLE],
  ])('%s están en el esquema', (_, values) => {
    for (const value of values) expect(schema).toContain(`'${value}'`)
  })

  it('ids únicos', () => {
    for (const list of [CITIES, CATEGORIES, STATUSES]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length)
    }
  })
})
