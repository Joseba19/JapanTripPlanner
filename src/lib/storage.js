// localStorage puede fallar (modo privado, almacenamiento bloqueado): nunca rompemos la app por ello.
const PREFIX = 'jtp.'

export function readStored(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeStored(key, value) {
  try {
    if (value == null) window.localStorage.removeItem(PREFIX + key)
    else window.localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // Sin almacenamiento: el valor vive solo en memoria durante la sesión
  }
}
