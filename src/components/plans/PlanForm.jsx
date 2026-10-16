import { useId, useState } from 'react'
import { CATEGORIES, CITIES, cityColor, LIMITS, OWNERS, PEOPLE, STATUSES, statusColor } from '../../lib/constants.js'
import { defaultAttendees, emptyForm, formToPlan, planToForm, validateForm } from '../../lib/planValues.js'
import Button from '../ui/Button.jsx'
import Chip from '../ui/Chip.jsx'
import DurationPicker from '../ui/DurationPicker.jsx'
import Field from '../ui/Field.jsx'
import PersonPicker from '../ui/PersonPicker.jsx'
import PriceInput from '../ui/PriceInput.jsx'
import Segmented from '../ui/Segmented.jsx'
import styles from './PlanForm.module.css'

/** Crear (sin `plan`) o editar un plan. `onSubmit(values)` devuelve una promesa. */
export default function PlanForm({ plan, me, defaultCity, zones, rate, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => (plan ? planToForm(plan) : emptyForm(me, { city: defaultCity })))
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [attendeesTouched, setAttendeesTouched] = useState(Boolean(plan))
  const zonesId = useId()

  const set = (patch) => {
    setForm((current) => ({ ...current, ...patch }))
    // Quita el error de los campos que se acaban de tocar
    setErrors((current) => {
      const next = { ...current }
      Object.keys(patch).forEach((key) => delete next[key])
      return next
    })
  }

  const setOwner = (owner) => set(attendeesTouched ? { owner } : { owner, attendees: defaultAttendees(owner) })

  const submit = async (event) => {
    event.preventDefault()
    const found = validateForm(form)
    setErrors(found)
    if (Object.keys(found).length) {
      // Lleva el foco al primer campo con error
      const formElement = event.currentTarget
      requestAnimationFrame(() => {
        const target = formElement.querySelector('[aria-invalid="true"], [data-invalid="true"]')
        target?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        target?.focus({ preventScroll: true })
      })
      return
    }
    setSaving(true)
    setSubmitError(null)
    try {
      await onSubmit(formToPlan(form))
    } catch (error) {
      setSubmitError(error.message)
      setSaving(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <Field label="Título" error={errors.title}>
        {({ id, describedBy, invalid }) => (
          <input
            id={id}
            className="input"
            value={form.title}
            maxLength={LIMITS.title}
            placeholder="Fushimi Inari al amanecer"
            autoFocus={!plan}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => set({ title: e.target.value })}
          />
        )}
      </Field>

      <Field label="Ciudad" as="fieldset" error={errors.city}>
        {({ describedBy }) => (
          <div className={styles.chips} aria-describedby={describedBy} data-invalid={Boolean(errors.city) || undefined}>
            {CITIES.map((city) => (
              <Chip key={city.id} kanji={city.kanji} color={cityColor(city.id)} selected={form.city === city.id} onClick={() => set({ city: city.id })}>
                {city.label}
              </Chip>
            ))}
          </div>
        )}
      </Field>

      <div className={styles.row}>
        <Field label="Zona" optional error={errors.zone}>
          {({ id, describedBy, invalid }) => (
            <>
              <input
                id={id}
                className="input"
                value={form.zone}
                maxLength={LIMITS.zone}
                placeholder="Shibuya, Gion…"
                list={zonesId}
                autoComplete="off"
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                onChange={(e) => set({ zone: e.target.value })}
              />
              <datalist id={zonesId}>
                {zones.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label="Dirección o enlace de Maps" optional error={errors.location}>
          {({ id, describedBy, invalid }) => (
            <input
              id={id}
              className="input"
              value={form.location}
              maxLength={LIMITS.location}
              placeholder="https://maps.app.goo.gl/…"
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={invalid || undefined}
              onChange={(e) => set({ location: e.target.value })}
            />
          )}
        </Field>
      </div>

      <Field label="Categoría" as="fieldset" error={errors.category}>
        {({ describedBy }) => (
          <div className={styles.chips} aria-describedby={describedBy} data-invalid={Boolean(errors.category) || undefined}>
            {CATEGORIES.map((category) => (
              <Chip
                key={category.id}
                kanji={category.kanji}
                color="var(--gold)"
                selected={form.category === category.id}
                onClick={() => set({ category: category.id })}
              >
                {category.short ?? category.label}
              </Chip>
            ))}
          </div>
        )}
      </Field>

      <Field label="Precio" optional error={errors.price_amount}>
        {({ id, describedBy, invalid }) => (
          <PriceInput
            id={id}
            describedBy={describedBy}
            invalid={invalid}
            amount={form.price_amount}
            currency={form.price_currency}
            per={form.price_per}
            rate={rate}
            onChange={set}
          />
        )}
      </Field>

      <Field label="Duración" as="fieldset" optional error={errors.duration_min}>
        {({ describedBy }) => (
          <DurationPicker value={form.duration_min} describedBy={describedBy} onChange={(duration_min) => set({ duration_min })} />
        )}
      </Field>

      <Field label="¿De quién es el plan?" as="fieldset" error={errors.owner}>
        {({ describedBy }) => <PersonPicker label="Dueño" options={OWNERS} value={form.owner} describedBy={describedBy} onChange={setOwner} />}
      </Field>

      <Field label="¿Quién se apunta?" as="fieldset">
        {() => (
          <PersonPicker
            label="Se apuntan"
            multiple
            options={PEOPLE}
            value={form.attendees}
            onChange={(attendees) => {
              setAttendeesTouched(true)
              set({ attendees })
            }}
          />
        )}
      </Field>

      <Field label="Estado" as="fieldset">
        {() => (
          <Segmented
            label="Estado"
            options={STATUSES.map((s) => ({ ...s, color: statusColor(s.id) }))}
            value={form.status}
            onChange={(status) => set({ status })}
          />
        )}
      </Field>

      <Field label="Notas" optional error={errors.notes} hint={form.notes.length > LIMITS.notes * 0.8 ? `${form.notes.length}/${LIMITS.notes}` : undefined}>
        {({ id, describedBy, invalid }) => (
          <textarea
            id={id}
            className="input"
            value={form.notes}
            maxLength={LIMITS.notes}
            rows={4}
            placeholder="Horarios, reservas, trucos…"
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            onChange={(e) => set({ notes: e.target.value })}
          />
        )}
      </Field>

      <div className={styles.actions}>
        {submitError && (
          <p className={styles.submitError} role="alert">
            {submitError}
          </p>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" loading={saving} icon="check">
          {plan ? 'Guardar cambios' : 'Crear plan'}
        </Button>
      </div>
    </form>
  )
}
