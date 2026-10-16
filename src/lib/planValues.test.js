import { describe, expect, it } from 'vitest'
import { defaultAttendees, emptyForm, formToPlan, parseAmount, planToForm, validateForm } from './planValues.js'

describe('parseAmount', () => {
  it('yenes: puntos y comas son miles', () => {
    expect(parseAmount('3.800', 'JPY')).toBe(3800)
    expect(parseAmount('3,800', 'JPY')).toBe(3800)
    expect(parseAmount('¥ 12 000', 'JPY')).toBe(12000)
  })
  it('euros: coma decimal y punto de miles', () => {
    expect(parseAmount('18,50', 'EUR')).toBe(18.5)
    expect(parseAmount('18.5', 'EUR')).toBe(18.5)
    expect(parseAmount('1.200', 'EUR')).toBe(1200)
    expect(parseAmount('1.200,50 €', 'EUR')).toBe(1200.5)
  })
  it('vacío es null y el texto no numérico es NaN', () => {
    expect(parseAmount('', 'JPY')).toBeNull()
    expect(parseAmount('   ', 'EUR')).toBeNull()
    expect(parseAmount('gratis', 'JPY')).toBeNaN()
    expect(parseAmount('-5', 'EUR')).toBeNaN()
  })
})

describe('defaultAttendees', () => {
  it('el dueño se apunta y "Todos" apunta a los 4', () => {
    expect(defaultAttendees('Filip')).toEqual(['Filip'])
    expect(defaultAttendees('Todos')).toEqual(['Joseba', 'Filip', 'Gahona', 'Ander'])
  })
})

describe('formulario', () => {
  const valid = { ...emptyForm('Joseba'), title: '  Fushimi Inari ', city: 'kioto', category: 'templos' }

  it('un formulario vacío pide título, ciudad y categoría', () => {
    expect(Object.keys(validateForm(emptyForm('Joseba'))).sort()).toEqual(['category', 'city', 'title'])
  })
  it('un formulario completo es válido', () => {
    expect(validateForm(valid)).toEqual({})
  })
  it('detecta un precio mal escrito', () => {
    expect(validateForm({ ...valid, price_amount: '12€abc' }).price_amount).toBeTruthy()
  })
  it('la imagen tiene que ser https', () => {
    expect(validateForm({ ...valid, image_url: 'https://example.com/foto.jpg' })).toEqual({})
    expect(validateForm({ ...valid, image_url: 'http://example.com/foto.jpg' }).image_url).toBeTruthy()
    expect(validateForm({ ...valid, image_url: 'foto.jpg' }).image_url).toBeTruthy()
    expect(validateForm({ ...valid, image_url: 'https://a b.com' }).image_url).toBeTruthy()
    expect(formToPlan({ ...valid, image_url: '   ' }).image_url).toBeNull()
  })
  it('formToPlan limpia textos y ordena a los apuntados', () => {
    const plan = formToPlan({ ...valid, zone: '  ', price_amount: '3.800', attendees: ['Ander', 'Joseba'] })
    expect(plan.title).toBe('Fushimi Inari')
    expect(plan.zone).toBeNull()
    expect(plan.price_amount).toBe(3800)
    expect(plan.attendees).toEqual(['Joseba', 'Ander'])
  })
  it('ida y vuelta plan → formulario → plan', () => {
    const plan = formToPlan({ ...valid, price_amount: '18,5', price_currency: 'EUR', duration_min: 90 })
    expect(formToPlan(planToForm(plan))).toEqual(plan)
  })
})
