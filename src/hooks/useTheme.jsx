import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { readStored, writeStored } from '../lib/storage.js'

// Debe coincidir con el script de index.html, que aplica el tema antes del primer pintado
export const THEMES = [
  { id: 'system', label: 'Sistema' },
  { id: 'dark', label: 'Oscuro' },
  { id: 'light', label: 'Claro' },
]

const META_COLORS = { dark: '#0f1014', light: '#f3eee3' }
const lightQuery = () => window.matchMedia('(prefers-color-scheme: light)')

function apply(pref) {
  const resolved = pref === 'light' || (pref === 'system' && lightQuery().matches) ? 'light' : 'dark'
  document.documentElement.dataset.theme = resolved
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', META_COLORS[resolved])
}

const ThemeContext = createContext(null)

/** Preferencia de tema de este dispositivo. Con "system" sigue los cambios del sistema en vivo. */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = readStored('theme')
    return THEMES.some((t) => t.id === stored) ? stored : 'dark'
  })

  useEffect(() => {
    apply(theme)
    if (theme !== 'system') return
    const query = lightQuery()
    const onChange = () => apply('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    writeStored('theme', next)
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return context
}
