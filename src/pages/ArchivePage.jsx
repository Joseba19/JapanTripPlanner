import { useMemo, useState } from 'react'
import { EmptyState } from '../components/plans/PlanList.jsx'
import Button from '../components/ui/Button.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { CITY_BY_ID, cityColor } from '../lib/constants.js'
import { relativeTime } from '../lib/format.js'
import { usePlans } from '../state/PlansProvider.jsx'
import styles from './ArchivePage.module.css'

export default function ArchivePage() {
  const { archived, status, restore, destroy } = usePlans()
  const toast = useToast()
  const [confirming, setConfirming] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const list = useMemo(() => [...archived].sort((a, b) => (a.archived_at < b.archived_at ? 1 : -1)), [archived])

  const confirmDelete = async () => {
    setDeleting(true)
    const ok = await destroy(confirming.id)
    setDeleting(false)
    if (ok) {
      toast.show({ message: `«${confirming.title}» borrado para siempre` })
      setConfirming(null)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Archivo</h1>
        <p className={styles.intro}>
          Los planes archivados no aparecen en la lista. Puedes restaurarlos o borrarlos para siempre.
        </p>
      </header>

      {status === 'ready' && !list.length ? (
        <EmptyState kanji="空" title="El archivo está vacío">
          Cuando archives un plan aparecerá aquí.
        </EmptyState>
      ) : (
        <ul className={styles.list}>
          {list.map((plan) => (
            <li key={plan.id} className={styles.row} style={{ '--city-color': cityColor(plan.city) }}>
              <div className={styles.info}>
                <p className={styles.planTitle}>{plan.title}</p>
                <p className={styles.meta}>
                  <span className={styles.city}>{CITY_BY_ID[plan.city]?.label}</span>
                  {' · '}archivado por {plan.archived_by ?? 'alguien'} {relativeTime(plan.archived_at)}
                </p>
              </div>
              <div className={styles.actions}>
                <Button size="sm" icon="restore" onClick={() => restore(plan.id)}>
                  Restaurar
                </Button>
                <Button size="sm" variant="danger" icon="trash" onClick={() => setConfirming(plan)} aria-label={`Borrar ${plan.title} para siempre`} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        variant="confirm"
        open={Boolean(confirming)}
        onClose={() => !deleting && setConfirming(null)}
        title="¿Borrar para siempre?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="danger" icon="trash" loading={deleting} onClick={confirmDelete}>
              Borrar
            </Button>
          </>
        }
      >
        <p className={styles.confirmText}>
          «{confirming?.title}» se eliminará para los cuatro y no se podrá recuperar.
        </p>
      </Sheet>
    </div>
  )
}
