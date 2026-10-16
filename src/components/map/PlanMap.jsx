import { AttributionControl, LngLatBounds, Map as MapLibre, Marker, NavigationControl, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
// MapLibre 6 calcula la ruta de su worker en tiempo de ejecución, y en el bundle no existiría:
// Vite lo empaqueta aparte (con sus imports) y se le pasa la URL
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef, useState } from 'react'
import { CATEGORY_BY_ID, cityColor } from '../../lib/constants.js'
import styles from './PlanMap.module.css'

setWorkerUrl(workerUrl)

// OpenFreeMap, estilo Liberty: mapa vectorial parecido al de Google, gratis, sin clave ni cuenta
const STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const JAPAN = { center: [137.4, 35.3], zoom: 5.6 } // de Tokio a Osaka
// Nombres en español o inglés si existen; si no, transcritos al alfabeto latino (el estilo los pone en japonés)
const LATIN_NAME = ['coalesce', ['get', 'name:es'], ['get', 'name:en'], ['get', 'name_en'], ['get', 'name:latin'], ['get', 'name']]

/** Chincheta con el kanji de la categoría y el color de la ciudad (rellena si está confirmado o hecho). */
function pinElement(onOpen) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = styles.pin
  const head = document.createElement('span')
  head.className = styles.pinHead
  const kanji = document.createElement('span')
  kanji.className = 'kanji'
  kanji.setAttribute('aria-hidden', 'true')
  head.append(kanji)
  el.append(head)
  el.addEventListener('click', (event) => {
    event.stopPropagation()
    onOpen(el.dataset.id)
  })
  return el
}

/** Los datos del plan pueden cambiar (otro lo edita): se actualiza la chincheta sin recrearla. */
function updatePin(el, plan, selected) {
  el.dataset.id = plan.id
  // El título va como texto: lo escribe cualquiera
  el.title = plan.title
  el.setAttribute('aria-label', plan.title)
  el.toggleAttribute('data-selected', selected)
  el.style.zIndex = selected ? '2' : ''
  const head = el.firstChild
  head.style.setProperty('--pin', cityColor(plan.city))
  head.dataset.status = plan.status
  head.firstChild.textContent = CATEGORY_BY_ID[plan.category]?.kanji ?? '他'
}

/**
 * Mapa de los planes. `points`: [{ plan, lat, lng }]. Tocar una chincheta abre el plan (`onOpen(id)`).
 * Se ajusta a las chinchetas cuando cambia el conjunto (al filtrar o cambiar de ciudad), no al editar un plan.
 */
export default function PlanMap({ points, selectedId, onOpen }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const onOpenRef = useRef(onOpen)
  onOpenRef.current = onOpen
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let map
    try {
      map = new MapLibre({
        container: containerRef.current,
        style: STYLE,
        center: JAPAN.center,
        zoom: JAPAN.zoom,
        minZoom: 3,
        attributionControl: false,
        dragRotate: false, // girar el mapa sin querer despista más de lo que ayuda
      })
    } catch {
      // Sin WebGL (navegador muy antiguo o desactivado)
      setFailed(true)
      return
    }
    map.touchZoomRotate.disableRotation()
    map.addControl(new NavigationControl({ showCompass: false }), 'top-left')
    // Abajo a la izquierda: en el móvil el botón "+" tapa la esquina derecha, y la atribución debe verse
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left')
    map.on('load', () => {
      for (const layer of map.getStyle().layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field']) map.setLayoutProperty(layer.id, 'text-field', LATIN_NAME)
      }
    })
    mapRef.current = map
    // El panel de escritorio o la rotación del móvil cambian el tamaño: MapLibre tiene que enterarse
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)
    const markers = markersRef.current
    return () => {
      observer.disconnect()
      markers.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const markers = markersRef.current
    const seen = new Set()
    for (const { plan, lat, lng } of points) {
      seen.add(plan.id)
      let marker = markers.get(plan.id)
      if (!marker) {
        marker = new Marker({ element: pinElement((id) => onOpenRef.current(id)), anchor: 'bottom' })
        marker.setLngLat([lng, lat]).addTo(map)
        markers.set(plan.id, marker)
      } else {
        marker.setLngLat([lng, lat])
      }
      updatePin(marker.getElement(), plan, plan.id === selectedId)
    }
    for (const [id, marker] of markers) {
      if (!seen.has(id)) {
        marker.remove()
        markers.delete(id)
      }
    }
  }, [points, selectedId])

  const idsKey = points
    .map((p) => p.plan.id)
    .sort()
    .join()
  useEffect(() => {
    const map = mapRef.current
    if (!map || !points.length) return
    if (points.length === 1) {
      map.jumpTo({ center: [points[0].lng, points[0].lat], zoom: 15 })
      return
    }
    const bounds = new LngLatBounds()
    for (const p of points) bounds.extend([p.lng, p.lat])
    // Márgenes: arriba la chincheta se dibuja 42 px por encima de su punto, a la izquierda están los botones
    // de zoom y abajo los créditos
    map.fitBounds(bounds, { padding: { top: 72, bottom: 48, left: 60, right: 44 }, maxZoom: 15, duration: 0 })
    // Solo cuando cambia qué planes se ven: editar uno no debe mover el mapa
  }, [idsKey])

  if (failed) {
    return (
      <div className={`${styles.map} ${styles.failed}`} role="note">
        Este navegador no puede mostrar el mapa (necesita WebGL). La lista sigue funcionando.
      </div>
    )
  }
  return <div ref={containerRef} className={styles.map} role="region" aria-label="Mapa de los planes" />
}
