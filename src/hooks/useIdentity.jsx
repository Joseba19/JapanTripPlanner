import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { PEOPLE } from '../lib/constants.js'
import { readStored, writeStored } from '../lib/storage.js'

const IdentityContext = createContext(null)

/** "¿Quién eres?" se elige una vez por dispositivo y se guarda en localStorage. */
export function IdentityProvider({ children }) {
  const [me, setMeState] = useState(() => {
    const stored = readStored('me')
    return PEOPLE.includes(stored) ? stored : null
  })

  const setMe = useCallback((name) => {
    setMeState(name)
    writeStored('me', name)
  }, [])

  const value = useMemo(() => ({ me, setMe }), [me, setMe])
  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>
}

export function useIdentity() {
  const context = useContext(IdentityContext)
  if (!context) throw new Error('useIdentity debe usarse dentro de <IdentityProvider>')
  return context
}
