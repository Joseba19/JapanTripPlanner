import { NavLink } from 'react-router'
import { usePlans } from '../../state/PlansProvider.jsx'
import Icon from '../ui/Icon.jsx'
import styles from './BottomNav.module.css'

export const NAV_ITEMS = [
  { to: '/', label: 'Planes', icon: 'list' },
  { to: '/archivo', label: 'Archivo', icon: 'archive' },
  { to: '/ajustes', label: 'Ajustes', icon: 'settings' },
]

/** Navegación inferior, solo en móvil (al alcance del pulgar). */
export default function BottomNav() {
  const { archived } = usePlans()
  return (
    <nav className={styles.nav} aria-label="Secciones">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} end className={styles.link}>
          <span className={styles.icon}>
            <Icon name={item.icon} size={22} />
            {item.to === '/archivo' && archived.length > 0 && <span className={styles.badge}>{archived.length}</span>}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
