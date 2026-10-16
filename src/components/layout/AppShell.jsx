import { Link, NavLink, Outlet } from 'react-router'
import { useIdentity } from '../../hooks/useIdentity.jsx'
import { relativeTime } from '../../lib/format.js'
import { usePlans } from '../../state/PlansProvider.jsx'
import { Avatar } from '../ui/Avatars.jsx'
import Icon from '../ui/Icon.jsx'
import styles from './AppShell.module.css'
import BottomNav, { NAV_ITEMS } from './BottomNav.jsx'

export default function AppShell() {
  const { me } = useIdentity()
  const { offline, syncedAt } = usePlans()
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to="/" className={styles.brand}>
          <span className={`${styles.mark} kanji`} aria-hidden="true">旅</span>
          <span className={styles.name}>
            Japón <span className={styles.year}>'27</span>
          </span>
        </Link>

        <nav className={styles.topNav} aria-label="Secciones">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end className={styles.topLink}>
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {offline && (
          <p
            className={styles.offline}
            role="status"
            title={syncedAt ? `Solo lectura · datos de ${relativeTime(new Date(syncedAt).toISOString())}` : 'Solo lectura'}
          >
            <Icon name="offline" size={16} />
            Sin conexión
          </p>
        )}

        <Link to="/ajustes" className={styles.me} aria-label={`Eres ${me}. Cambiar en Ajustes`}>
          <Avatar name={me} size={28} />
          <span className={styles.meName}>{me}</span>
        </Link>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
