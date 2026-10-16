import { STATUS_BY_ID } from './constants.js'

// Texto de cada evento del historial (tabla plan_events, la rellena un trigger en 003_collab.sql)
const FIELD_LABELS = {
  title: 'el título',
  city: 'la ciudad',
  zone: 'la zona',
  location: 'la dirección',
  price_amount: 'el precio',
  price_currency: 'el precio',
  price_per: 'el precio',
  duration_min: 'la duración',
  category: 'la categoría',
  notes: 'las notas',
  owner: 'el dueño',
  attendees: 'quién se apunta',
  votes: 'los votos',
  status: 'el estado',
  image_url: 'la portada',
}

const list = (items) => (items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`)

export function describeEvent(event) {
  switch (event.action) {
    case 'create':
      return 'creó el plan'
    case 'archive':
      return 'lo archivó'
    case 'restore':
      return 'lo restauró'
    case 'attend':
      return 'se apuntó'
    case 'unattend':
      return 'se desapuntó'
    case 'vote':
      return 'marcó que le interesa'
    case 'unvote':
      return 'quitó su "me interesa"'
    case 'status':
      return `lo marcó como ${STATUS_BY_ID[event.detail?.status]?.label.toLowerCase() ?? 'otro estado'}`
    default: {
      const fields = [...new Set((event.detail?.fields ?? []).map((f) => FIELD_LABELS[f]).filter(Boolean))]
      return fields.length ? `cambió ${list(fields)}` : 'editó el plan'
    }
  }
}
