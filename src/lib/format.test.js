import { describe, expect, it } from 'vitest'
import { formatDuration, formatEur, formatPrice, formatYen, mapsUrl, perPersonJpy, relativeTime } from './format.js'

const plan = (overrides) => ({ price_amount: 3800, price_currency: 'JPY', price_per: 'persona', attendees: [], ...overrides })

describe('formatYen / formatEur', () => {
  it('agrupa miles con punto', () => {
    expect(formatYen(3800)).toBe('¥3.800')
    expect(formatYen(1234567)).toBe('¥1.234.567')
    expect(formatYen(500.6)).toBe('¥501')
  })
  it('muestra céntimos solo si los hay', () => {
    expect(formatEur(18)).toBe('18 €')
    expect(formatEur(18.5)).toBe('18,50 €')
    expect(formatEur(1200)).toBe('1.200 €')
  })
})

describe('formatPrice', () => {
  it('convierte yenes a euros aproximados', () => {
    expect(formatPrice(plan(), 165)).toEqual({ primary: '¥3.800', secondary: '≈ 23 €', per: 'por persona' })
  })
  it('convierte euros a yenes', () => {
    expect(formatPrice(plan({ price_amount: 25, price_currency: 'EUR' }), 165).secondary).toBe('≈ ¥4.125')
  })
  it('usa un decimal para importes pequeños en euros', () => {
    expect(formatPrice(plan({ price_amount: 300 }), 165).secondary).toBe('≈ 1,80 €')
  })
  it('gratis y sin precio', () => {
    expect(formatPrice(plan({ price_amount: 0 }), 165)).toEqual({ primary: 'Gratis', secondary: null, per: null })
    expect(formatPrice(plan({ price_amount: null }), 165)).toBeNull()
  })
  it('indica si es el total', () => {
    expect(formatPrice(plan({ price_per: 'total' }), 165).per).toBe('total')
  })
})

describe('perPersonJpy', () => {
  it('reparte el total entre quienes se apuntan', () => {
    expect(perPersonJpy(plan({ price_amount: 8000, price_per: 'total', attendees: ['Joseba', 'Filip'] }), 165)).toBe(4000)
  })
  it('si nadie se apunta, reparte entre los 4', () => {
    expect(perPersonJpy(plan({ price_amount: 8000, price_per: 'total' }), 165)).toBe(2000)
  })
  it('convierte euros', () => {
    expect(perPersonJpy(plan({ price_amount: 10, price_currency: 'EUR' }), 160)).toBe(1600)
  })
})

describe('formatDuration', () => {
  it('formatea minutos y horas', () => {
    expect(formatDuration(null)).toBeNull()
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(90)).toBe('1 h 30')
    expect(formatDuration(480)).toBe('8 h')
  })
})

describe('mapsUrl', () => {
  it('respeta los enlaces y busca las direcciones', () => {
    expect(mapsUrl('https://maps.app.goo.gl/abc')).toBe('https://maps.app.goo.gl/abc')
    expect(mapsUrl('Golden Gai, Shinjuku')).toBe('https://www.google.com/maps/search/?api=1&query=Golden%20Gai%2C%20Shinjuku')
    expect(mapsUrl('  ')).toBeNull()
  })
})

describe('relativeTime', () => {
  it('describe el tiempo transcurrido en español', () => {
    const now = new Date('2026-10-16T12:00:00Z').getTime()
    expect(relativeTime('2026-10-16T10:00:00Z', now)).toBe('hace 2 horas')
    expect(relativeTime('2026-10-16T11:59:50Z', now)).toBe('ahora mismo')
  })
})
