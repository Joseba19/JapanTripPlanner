// Valores fijos del viaje. Deben coincidir con los CHECK de supabase/migrations/001_schema.sql.

export const PEOPLE = ['Joseba', 'Filip', 'Gahona', 'Ander']
export const EVERYONE = 'Todos'
export const OWNERS = [...PEOPLE, EVERYONE]

export const CITIES = [
  { id: 'tokio', label: 'Tokio', kanji: '東京' },
  { id: 'kioto', label: 'Kioto', kanji: '京都' },
  { id: 'osaka', label: 'Osaka', kanji: '大阪' },
  { id: 'kawaguchiko', label: 'Kawaguchiko', kanji: '河口湖' },
]

export const CATEGORIES = [
  { id: 'comida', label: 'Comida', kanji: '食' },
  { id: 'templos', label: 'Templos y santuarios', short: 'Templos', kanji: '寺' },
  { id: 'museos', label: 'Museos y arte', short: 'Museos', kanji: '美' },
  { id: 'compras', label: 'Compras', kanji: '買' },
  { id: 'naturaleza', label: 'Naturaleza', kanji: '森' },
  { id: 'noche', label: 'Vida nocturna', short: 'Noche', kanji: '夜' },
  { id: 'anime', label: 'Anime y ocio', short: 'Anime', kanji: '遊' },
  { id: 'experiencias', label: 'Experiencias', kanji: '体' },
  { id: 'miradores', label: 'Miradores', kanji: '景' },
  { id: 'otros', label: 'Otros', kanji: '他' },
]

export const STATUSES = [
  { id: 'idea', label: 'Idea', kanji: '案' },
  { id: 'confirmado', label: 'Confirmado', kanji: '確' },
  { id: 'hecho', label: 'Hecho', kanji: '済' },
]

export const CURRENCIES = [
  { id: 'JPY', symbol: '¥', label: 'Yenes' },
  { id: 'EUR', symbol: '€', label: 'Euros' },
]

export const DURATION_PRESETS = [
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 120, label: '2 h' },
  { minutes: 180, label: '3 h' },
  { minutes: 240, label: 'Medio día' },
  { minutes: 480, label: 'Día entero' },
]

// Filtros de precio por persona, en yenes
export const PRICE_FILTERS = [
  { value: 0, label: 'Gratis' },
  { value: 2000, label: '≤ ¥2.000' },
  { value: 5000, label: '≤ ¥5.000' },
  { value: 10000, label: '≤ ¥10.000' },
]

export const DURATION_FILTERS = [
  { value: 60, label: '≤ 1 h' },
  { value: 120, label: '≤ 2 h' },
  { value: 240, label: '≤ medio día' },
]

export const SORTS = [
  { id: 'manual', label: 'Orden del grupo' },
  { id: 'interes', label: 'Más interés' },
  { id: 'precio', label: 'Más baratos' },
  { id: 'duracion', label: 'Más cortos' },
  { id: 'recientes', label: 'Más recientes' },
]

export const DEFAULT_EUR_JPY = 165

export const LIMITS = { title: 120, zone: 60, location: 500, notes: 2000 }

const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]))

export const CITY_BY_ID = byId(CITIES)
export const CATEGORY_BY_ID = byId(CATEGORIES)
export const STATUS_BY_ID = byId(STATUSES)
export const SORT_IDS = SORTS.map((s) => s.id)

export const personColor = (name) => `var(--person-${String(name).toLowerCase()})`
export const cityColor = (id) => `var(--city-${id})`
export const statusColor = (id) => `var(--status-${id})`
