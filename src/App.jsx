import { Navigate, Route, Routes } from 'react-router'
import WhoAmI from './components/identity/WhoAmI.jsx'
import AppShell from './components/layout/AppShell.jsx'
import { EmptyState } from './components/plans/PlanList.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import { IdentityProvider, useIdentity } from './hooks/useIdentity.jsx'
import { useServiceWorker } from './hooks/useServiceWorker.js'
import { ThemeProvider } from './hooks/useTheme.jsx'
import { db } from './lib/supabase.js'
import ArchivePage from './pages/ArchivePage.jsx'
import PlansPage from './pages/PlansPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { PlansProvider } from './state/PlansProvider.jsx'

function ServiceWorker() {
  useServiceWorker()
  return null
}

function IdentityGate({ children }) {
  const { me } = useIdentity()
  return me ? children : <WhoAmI />
}

export default function App() {
  if (!db) {
    return (
      <EmptyState kanji="鍵" title="Falta configurar Supabase">
        Copia <code>.env.example</code> a <code>.env.local</code> con la URL y la clave del proyecto y reinicia el servidor.
      </EmptyState>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <ServiceWorker />
        <IdentityProvider>
          <IdentityGate>
            <PlansProvider>
              <Routes>
                <Route element={<AppShell />}>
                  <Route index element={<PlansPage />} />
                  <Route path="archivo" element={<ArchivePage />} />
                  <Route path="ajustes" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </PlansProvider>
          </IdentityGate>
        </IdentityProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
