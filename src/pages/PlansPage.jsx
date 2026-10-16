import { useMemo, useState } from 'react'
import CityTabs from '../components/filters/CityTabs.jsx'
import FilterChips from '../components/filters/FilterChips.jsx'
import FilterPanel from '../components/filters/FilterPanel.jsx'
import SearchBar from '../components/filters/SearchBar.jsx'
import SortMenu from '../components/filters/SortMenu.jsx'
import PlanDetail from '../components/plans/PlanDetail.jsx'
import PlanForm from '../components/plans/PlanForm.jsx'
import PlanList, { EmptyState } from '../components/plans/PlanList.jsx'
import Button from '../components/ui/Button.jsx'
import Icon from '../components/ui/Icon.jsx'
import Sheet from '../components/ui/Sheet.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import { useFilters } from '../hooks/useFilters.js'
import { useIdentity } from '../hooks/useIdentity.jsx'
import { DESKTOP_QUERY, useMediaQuery } from '../hooks/useMediaQuery.js'
import { useOverlay } from '../hooks/useOverlay.js'
import { EMPTY_FILTERS, filterPlans, sortPlans } from '../lib/search.js'
import { usePlans } from '../state/PlansProvider.jsx'
import styles from './PlansPage.module.css'

export default function PlansPage() {
  const { status, error, plans, active, rate, reload, create, update, setStatus, archive, restore } = usePlans()
  const { me } = useIdentity()
  const toast = useToast()
  const { filters, setFilters, clearFilters, sort, setSort, activeCount } = useFilters()
  const overlay = useOverlay()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // La ciudad se cuenta aparte para que las pestañas muestren cuántos hay en cada una con el resto de filtros
  const withoutCity = useMemo(() => filterPlans(active, { ...filters, city: '' }, { me, rate }), [active, filters, me, rate])
  const visible = useMemo(
    () => sortPlans(filters.city ? withoutCity.filter((p) => p.city === filters.city) : withoutCity, sort, rate),
    [withoutCity, filters.city, sort, rate],
  )
  const cityCounts = useMemo(() => {
    const counts = { all: withoutCity.length }
    for (const plan of withoutCity) counts[plan.city] = (counts[plan.city] ?? 0) + 1
    return counts
  }, [withoutCity])

  const zones = useMemo(
    () => [...new Set(plans.map((p) => p.zone).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')),
    [plans],
  )

  const openId = overlay.planId ?? overlay.editId
  const openPlan = openId ? plans.find((p) => p.id === openId) : null

  let panelTitle = null
  let panel = null
  if (overlay.isNew) {
    panelTitle = 'Nuevo plan'
    panel = (
      <PlanForm
        key="new"
        me={me}
        defaultCity={filters.city}
        zones={zones}
        rate={rate}
        onCancel={overlay.close}
        onSubmit={async (values) => {
          const saved = await create(values)
          toast.show({ message: `«${saved.title}» creado` })
          overlay.showPlan(saved.id)
        }}
      />
    )
  } else if (overlay.editId && openPlan) {
    panelTitle = 'Editar plan'
    panel = (
      <PlanForm
        key={`edit-${openPlan.id}`}
        plan={openPlan}
        me={me}
        zones={zones}
        rate={rate}
        onCancel={overlay.close}
        onSubmit={async (values) => {
          await update(openPlan.id, values)
          toast.show({ message: 'Cambios guardados' })
          overlay.close()
        }}
      />
    )
  } else if (openId && openPlan) {
    panelTitle = openPlan.archived_at ? 'Plan archivado' : 'Plan'
    panel = (
      <PlanDetail
        plan={openPlan}
        rate={rate}
        onEdit={() => overlay.openEdit(openPlan.id)}
        onStatus={(value) => setStatus(openPlan.id, value)}
        onRestore={() => restore(openPlan.id)}
        onArchive={async () => {
          overlay.close()
          await archive(openPlan.id)
        }}
      />
    )
  } else if (openId && status === 'ready') {
    panelTitle = 'Plan no encontrado'
    panel = (
      <EmptyState kanji="無" title="Este plan ya no existe">
        Puede que alguien lo haya borrado definitivamente.
      </EmptyState>
    )
  }

  const emptyList =
    active.length === 0 ? (
      <EmptyState
        kanji="旅"
        title="Aún no hay planes"
        action={<Button variant="primary" icon="plus" onClick={overlay.openNew}>Añadir el primero</Button>}
      >
        Templos, ramen, onsen, karaoke… Todo lo que queráis hacer en Japón empieza aquí.
      </EmptyState>
    ) : (
      <EmptyState
        kanji="空"
        title="Ningún plan coincide"
        action={
          <Button onClick={() => setFilters(() => EMPTY_FILTERS)}>Ver todos los planes</Button>
        }
      >
        Prueba con otra búsqueda o quita algún filtro.
      </EmptyState>
    )

  const filterPanel = (
    <FilterPanel filters={filters} onChange={setFilters} onClear={clearFilters} activeCount={activeCount} me={me} />
  )

  return (
    <div className={styles.page}>
      {isDesktop && (
        <aside className={styles.sidebar} aria-label="Filtros">
          <Button variant="primary" icon="plus" className={styles.newDesktop} onClick={overlay.openNew}>
            Nuevo plan
          </Button>
          {filterPanel}
        </aside>
      )}

      <section className={styles.main} aria-label="Planes">
        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <SearchBar value={filters.q} onChange={(q) => setFilters({ q })} />
            {!isDesktop && (
              <button
                type="button"
                className={styles.filterButton}
                onClick={() => setFiltersOpen(true)}
                aria-label={activeCount ? `Filtros (${activeCount} activos)` : 'Filtros'}
              >
                <Icon name="filter" />
                {activeCount > 0 && <span className={styles.filterCount}>{activeCount}</span>}
              </button>
            )}
          </div>
          <CityTabs value={filters.city} counts={cityCounts} onChange={(city) => setFilters({ city })} />
        </div>

        {status === 'error' ? (
          <EmptyState kanji="断" title="No se pudo conectar" action={<Button onClick={reload}>Reintentar</Button>}>
            {error}. Si es la primera vez, comprueba que has ejecutado el SQL de <code>supabase/migrations</code>.
          </EmptyState>
        ) : (
          <>
            <div className={styles.listHeader}>
              <p className={styles.count} aria-live="polite">
                {status === 'ready' && `${visible.length} ${visible.length === 1 ? 'plan' : 'planes'}`}
              </p>
              <SortMenu value={sort} onChange={setSort} />
            </div>
            {activeCount > 0 && (
              <div className={styles.activeFilters}>
                <FilterChips filters={filters} onChange={setFilters} onClear={clearFilters} />
              </div>
            )}
            <PlanList
              plans={visible}
              rate={rate}
              loading={status === 'loading'}
              selectedId={isDesktop ? openId : null}
              onOpen={overlay.openPlan}
              empty={emptyList}
            />
          </>
        )}
      </section>

      {isDesktop ? (
        <aside className={styles.panel} aria-label={panelTitle ?? 'Detalle'}>
          {panel ? (
            <>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>{panelTitle}</h2>
                <button type="button" className={styles.panelClose} onClick={overlay.close} aria-label="Cerrar">
                  <Icon name="close" />
                </button>
              </div>
              <div className={styles.panelBody}>{panel}</div>
            </>
          ) : (
            <EmptyState kanji="選" title="Elige un plan">
              Toca una tarjeta para ver los detalles o crea uno nuevo.
            </EmptyState>
          )}
        </aside>
      ) : (
        <>
          <Sheet open={Boolean(panel)} onClose={overlay.close} title={panelTitle}>
            {panel}
          </Sheet>
          <Sheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros">
            {filterPanel}
            <div className={styles.sheetDone}>
              <Button variant="primary" onClick={() => setFiltersOpen(false)}>
                Ver {visible.length} {visible.length === 1 ? 'plan' : 'planes'}
              </Button>
            </div>
          </Sheet>
          <button type="button" className={styles.fab} onClick={overlay.openNew} aria-label="Nuevo plan">
            <Icon name="plus" size={26} />
          </button>
        </>
      )}
    </div>
  )
}
