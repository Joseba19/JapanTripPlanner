import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
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
import { formatDuration, formatEur, formatYen, summarizePlans } from '../lib/format.js'
import { EMPTY_FILTERS, filterPlans, sortPlans } from '../lib/search.js'
import { positionForMove } from '../lib/ordering.js'
import { usePlans } from '../state/PlansProvider.jsx'
import styles from './PlansPage.module.css'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

/** "12 planes · 18 h 30 · ≈ ¥24.500 p. p.", con el detalle (euros y lo que falta) en `title`. */
function describeSummary({ count, minutes, jpy, unpriced, untimed }, rate) {
  const parts = [plural(count, 'plan', 'planes')]
  if (minutes > 0) parts.push(formatDuration(minutes))
  if (jpy > 0) parts.push(`≈ ${formatYen(jpy)} p. p.`)

  const detail = []
  if (jpy > 0) detail.push(`Coste estimado por persona: ${formatYen(jpy)}${rate > 0 ? ` ≈ ${formatEur(Math.round(jpy / rate))}` : ''}`)
  if (count && unpriced) detail.push(`${plural(unpriced, 'plan', 'planes')} sin precio`)
  if (count && untimed) detail.push(`${plural(untimed, 'plan', 'planes')} sin duración`)
  return { text: parts.join(' · '), detail: detail.join(' · ') || undefined }
}

/** Escribiendo en un campo, los atajos de una letra no deben saltar. */
const isTyping = (target) => Boolean(target?.closest?.('input, textarea, select, [contenteditable="true"]'))

export default function PlansPage() {
  const {
    status,
    error,
    plans,
    active,
    rate,
    offline,
    reload,
    create,
    update,
    setStatus,
    archive,
    restore,
    toggleAttendee,
    toggleVote,
    move,
  } = usePlans()
  const { me } = useIdentity()
  const toast = useToast()
  const { filters, setFilters, clearFilters, sort, setSort, activeCount } = useFilters()
  const overlay = useOverlay()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // La pestaña y el buscador responden al instante; la lista se recalcula en segundo plano
  // (React lo trocea en bloques pequeños, así una lista larga no bloquea el toque en móviles modestos)
  const listFilters = useDeferredValue(filters)
  const listSort = useDeferredValue(sort)

  // La ciudad se cuenta aparte para que las pestañas muestren cuántos hay en cada una con el resto de filtros
  const withoutCity = useMemo(
    () => filterPlans(active, { ...listFilters, city: '' }, { me, rate }),
    [active, listFilters, me, rate],
  )
  // Todas las tarjetas se montan ordenadas; los filtros solo deciden cuáles se ven (ver PlanList)
  const ordered = useMemo(() => sortPlans(active, listSort, rate), [active, listSort, rate])
  const visibleIds = useMemo(
    () => new Set((listFilters.city ? withoutCity.filter((p) => p.city === listFilters.city) : withoutCity).map((p) => p.id)),
    [withoutCity, listFilters.city],
  )
  const visible = useMemo(() => ordered.filter((p) => visibleIds.has(p.id)), [ordered, visibleIds])
  const cityCounts = useMemo(() => {
    const counts = { all: withoutCity.length }
    for (const plan of withoutCity) counts[plan.city] = (counts[plan.city] ?? 0) + 1
    return counts
  }, [withoutCity])

  const summary = useMemo(() => describeSummary(summarizePlans(visible, rate), rate), [visible, rate])

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
        readOnly={offline}
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
        readOnly={offline}
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
        me={me}
        readOnly={offline}
        onEdit={() => overlay.openEdit(openPlan.id)}
        onToggleAttend={() => toggleAttendee(openPlan.id)}
        onToggleVote={() => toggleVote(openPlan.id)}
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

  const noPlansAtAll = active.length === 0
  const emptyList = useMemo(
    () =>
      noPlansAtAll ? (
        <EmptyState
          kanji="旅"
          title="Aún no hay planes"
          action={
            <Button variant="primary" icon="plus" onClick={overlay.openNew} disabled={offline}>
              Añadir el primero
            </Button>
          }
        >
          Templos, ramen, onsen, karaoke… Todo lo que queráis hacer en Japón empieza aquí.
        </EmptyState>
      ) : (
        <EmptyState
          kanji="空"
          title="Ningún plan coincide"
          action={<Button onClick={() => setFilters(() => EMPTY_FILTERS)}>Ver todos los planes</Button>}
        >
          Prueba con otra búsqueda o quita algún filtro.
        </EmptyState>
      ),
    [noPlansAtAll, overlay.openNew, setFilters, offline],
  )

  // Props estables: PlanList está memorizada y solo se repinta cuando cambia la lista (en segundo plano)
  const cardProps = useMemo(
    () => ({ me, rate, readOnly: offline, onOpen: overlay.openPlan, onToggleAttend: toggleAttendee, onToggleVote: toggleVote }),
    [me, rate, offline, overlay.openPlan, toggleAttendee, toggleVote],
  )
  const onMove = useMemo(
    () =>
      // Sin conexión no se puede reordenar: la lista se queda fija (sin asas)
      listSort === 'manual' && !offline
        ? (from, to) => {
            const position = positionForMove(plans, visible, from, to)
            if (position) move(visible[from].id, position)
          }
        : undefined,
    [listSort, offline, plans, visible, move],
  )

  // Atajos de escritorio: "/" busca, "n" crea un plan y Esc cierra el panel
  const shortcuts = useRef(null)
  shortcuts.current = { panelOpen: Boolean(openId || overlay.isNew), offline, overlay }
  useEffect(() => {
    if (!isDesktop) return
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      // Un diálogo abierto (confirmar, etc.) gestiona sus propias teclas
      if (document.querySelector('dialog[open]')) return
      const { panelOpen, offline, overlay } = shortcuts.current
      if (event.key === 'Escape') {
        // Primero se sale del campo; un segundo Esc cierra el panel
        if (isTyping(event.target)) event.target.blur()
        else if (panelOpen) overlay.close()
        return
      }
      if (isTyping(event.target)) return
      if (event.key === '/') {
        event.preventDefault()
        document.getElementById('plan-search')?.focus()
      } else if ((event.key === 'n' || event.key === 'N') && !offline) {
        event.preventDefault()
        overlay.openNew()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isDesktop])

  const filterPanel = (
    <FilterPanel filters={filters} onChange={setFilters} onClear={clearFilters} activeCount={activeCount} me={me} />
  )

  return (
    <div className={styles.page}>
      {isDesktop && (
        <aside className={styles.sidebar} aria-label="Filtros">
          <Button
            variant="primary"
            icon="plus"
            className={styles.newDesktop}
            onClick={overlay.openNew}
            disabled={offline}
            aria-keyshortcuts="n"
            title={offline ? 'Sin conexión' : 'Nuevo plan (N)'}
          >
            Nuevo plan
          </Button>
          {filterPanel}
        </aside>
      )}

      <section className={styles.main} aria-label="Planes">
        <div className={styles.toolbar}>
          <div className={styles.searchRow}>
            <SearchBar value={filters.q} onChange={(q) => setFilters({ q })} shortcut={isDesktop ? '/' : undefined} />
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
              <p className={styles.count} aria-live="polite" title={status === 'ready' ? summary.detail : undefined}>
                {status === 'ready' && summary.text}
              </p>
              <SortMenu value={sort} onChange={setSort} />
            </div>
            {activeCount > 0 && (
              <div className={styles.activeFilters}>
                <FilterChips filters={filters} onChange={setFilters} onClear={clearFilters} />
              </div>
            )}
            <PlanList
              plans={ordered}
              visibleIds={visibleIds}
              loading={status === 'loading'}
              selectedId={isDesktop ? openId : null}
              empty={emptyList}
              cardProps={cardProps}
              onMove={onMove}
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
              <div className={styles.panelBody} key={overlay.isNew ? 'new' : `${overlay.editId ? 'edit' : 'plan'}-${openId}`}>
                {panel}
              </div>
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
          <button type="button" className={styles.fab} onClick={overlay.openNew} disabled={offline} aria-label="Nuevo plan">
            <Icon name="plus" size={26} />
          </button>
        </>
      )}
    </div>
  )
}
