import { Link, NavLink, Outlet } from 'react-router'
import { useIdentity } from '../../hooks/useIdentity.jsx'
import { Avatar } from '../ui/Avatars.jsx'
import Icon from '../ui/Icon.jsx'
import styles from './AppShell.module.css'
import BottomNav, { NAV_ITEMS } from './BottomNav.jsx'

export default function AppShell() {
  const { me } = useIdentity()
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
