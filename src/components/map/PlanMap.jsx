import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { CATEGORY_BY_ID, cityColor } from '../../lib/constants.js'
import styles from './PlanMap.module.css'

// Mosaicos estándar de OpenStreetMap: sin clave, con atribución obligatoria y para un uso pequeño como este.
// En el tema oscuro se invierten con un filtro CSS (ver PlanMap.module.css).
// (CARTO pedía ya una clave: sus mosaicos salían con la marca "API KEY REQUIRED".)
const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
const JAPAN = { center: [35.3, 137.4], zoom: 6 } // de Tokio a Osaka

// El tema ya resuelto ("system" incluido) vive en <html data-theme>
function subscribeTheme(onChange) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  return () => observer.disconnect()
}
const useResolvedTheme = () =>
  useSyncExternalStore(subscribeTheme, () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'))

/** Chincheta con el kanji de la categoría y el color de la ciudad (rellena si está confirmado o hecho). */
function pinIcon(plan, selected) {
  const kanji = CATEGORY_BY_ID[plan.category]?.kanji ?? '他'
  return L.divIcon({
    className: styles.pin,
    html: `<span class="${styles.pinHead}" style="--pin: ${cityColor(plan.city)}" data-status="${plan.status}"${selected ? ' data-selected' : ''}><span class="kanji">${kanji}</span></span>`,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    tooltipAnchor: [0, -40],
  })
}

/**
 * Mapa de los planes. `points`: [{ plan, lat, lng }]. Tocar una chincheta abre el plan (`onOpen(id)`).
 * Se ajusta a las chinchetas cuando cambia el conjunto (al filtrar o cambiar de ciudad), no al editar un plan.
 */
export default function PlanMap({ points, selectedId, onOpen }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(null)
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen
  const theme = useResolvedTheme()

  useEffect(() => {
    const map = L.map(containerRef.current, {
      center: JAPAN.center,
      zoom: JAPAN.zoom,
      minZoom: 4,
      zoomSnap: 0.5,
      attributionControl: false,
    })
    // Abajo a la izquierda: en el móvil el botón "+" tapa la esquina derecha, y la atribución debe verse
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map)
    markersRef.current = L.layerGroup().addTo(map)
    mapRef.current = map
    // El panel de escritorio o la rotación del móvil cambian el tamaño: Leaflet tiene que enterarse
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(containerRef.current)
    return () => {
      observer.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    // crossOrigin: respuestas CORS (no opacas), que el service worker puede guardar sin inflar la cuota
    const layer = L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION, crossOrigin: true })
    layer.addTo(mapRef.current)
    return () => layer.remove()
  }, [])

  useEffect(() => {
    const group = markersRef.current
    group.clearLayers()
    for (const { plan, lat, lng } of points) {
      const selected = plan.id === selectedId
      const marker = L.marker([lat, lng], {
        icon: pinIcon(plan, selected),
        title: plan.title,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : 0,
      })
      // El título va como texto (no HTML): lo escribe cualquiera
      const label = document.createElement('span')
      label.textContent = plan.title
      marker.bindTooltip(label, { direction: 'top', className: styles.tooltip })
      marker.on('click', () => onOpenRef.current(plan.id))
      group.addLayer(marker)
    }
  }, [points, selectedId])

  const idsKey = points
    .map((p) => p.plan.id)
    .sort()
    .join()
  useEffect(() => {
    const map = mapRef.current
    if (!points.length) return
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15)
    // Más margen arriba: la chincheta se dibuja 42 px por encima de su punto
    else
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), {
        paddingTopLeft: [36, 64],
        paddingBottomRight: [36, 28],
        maxZoom: 15,
      })
    // Solo cuando cambia qué planes se ven: editar uno no debe mover el mapa
  }, [idsKey])

  return <div ref={containerRef} className={styles.map} data-tone={theme} role="region" aria-label="Mapa de los planes" />
}
