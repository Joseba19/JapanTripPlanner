import { describe, expect, it } from 'vitest'
import { describeEvent } from './events.js'

describe('describeEvent', () => {
  it('acciones simples', () => {
    expect(describeEvent({ action: 'create' })).toBe('creó el plan')
    expect(describeEvent({ action: 'attend' })).toBe('se apuntó')
    expect(describeEvent({ action: 'unvote' })).toBe('quitó su "me interesa"')
  })
  it('cambio de estado', () => {
    expect(describeEvent({ action: 'status', detail: { status: 'confirmado' } })).toBe('lo marcó como confirmado')
  })
  it('edición: une los campos sin repetir el precio', () => {
    expect(describeEvent({ action: 'update', detail: { fields: ['price_amount', 'price_currency', 'title'] } })).toBe(
      'cambió el precio y el título',
    )
    expect(describeEvent({ action: 'update', detail: { fields: ['notes', 'zone', 'image_url'] } })).toBe(
      'cambió las notas, la zona y la portada',
    )
    expect(describeEvent({ action: 'update', detail: { fields: ['archived_by'] } })).toBe('editó el plan')
  })
})
