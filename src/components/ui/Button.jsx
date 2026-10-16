import Icon from './Icon.jsx'
import styles from './Button.module.css'

/** variant: primary | secondary | ghost | danger · size: md | sm */
export default function Button({ variant = 'secondary', size = 'md', icon, loading, disabled, className = '', children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 18} />}
      {children && <span>{children}</span>}
    </button>
  )
}
