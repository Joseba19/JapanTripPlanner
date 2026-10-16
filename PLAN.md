# PLAN — Japan Trip Planner (旅)

## Contexto

Web personal (no comercial) para que 4 amigos (Joseba, Filip, Gahona, Ander) planifiquen las actividades de un viaje a Japón dentro de unos 7 meses (≈ mayo de 2027). Cada uno añade planes, ve los de los demás, filtra, busca, se apunta y reordena, desde el móvil o el ordenador, sin login.

- **Stack:** React + Vite (JavaScript), Supabase (Postgres, llamado directamente desde el cliente) y Vercel Hobby.
- **Restricciones:** Supabase en plan gratuito (se pausa tras 7 días sin actividad) y Vercel Hobby.
- **Punto de partida:** el repo está vacío (solo `.git`), así que no hay código que reutilizar.

> Estado (2026-10-16): Fases 0, 1 y 1.5 (portadas) desplegadas en Vercel. Siguiente: Fase 2.

---

## 1. Decisiones tomadas (según tus respuestas)

| Tema | Decisión |
|---|---|
| Acceso | **Abierto**: sin código ni login. Mitigaciones abajo. |
| Identidad | "¿Quién eres?" se elige una vez por dispositivo (`localStorage`) y se cambia desde la cabecera. Rellena el dueño por defecto, el botón "me apunto", el filtro "mis planes" y la autoría de los cambios. |
| Edición | Cualquiera de los 4 edita o archiva cualquier plan. Se registra quién hizo cada cambio (`updated_by` + historial). |
| Archivo | "Borrar" = archivar. En **Archivados** se puede ver, restaurar o **borrar definitivamente** (con confirmación). La base de datos solo permite borrar planes que ya estén archivados. |
| Orden | **Lista única** sin días. Se reordena arrastrando (orden manual compartido por todos). |
| Precio | Importe + moneda (¥ o €) + "por persona / total". El otro valor se calcula con un **tipo de cambio fijo y editable** que se guarda en la BD y es compartido. |
| Categorías | Fijas (10, con icono y color). La **zona** es texto libre con autocompletado a partir de las zonas ya usadas. |
| Duración | Se guarda en minutos. Chips rápidos (30 min · 1 h · 2 h · 3 h · medio día · día entero) o entrada manual. |
| Extras | Tiempo real, votos de interés, imagen por URL y PWA sin conexión (solo lectura). |
| Estética | **Sumi & Washi nocturno**, con tema oscuro por defecto y un tema claro opcional. |

### Qué implica "abierto" y cómo lo mitigamos
La clave `anon` de Supabase va dentro del bundle, así que cualquiera con la URL puede leer y escribir. Para un proyecto entre amigos es aceptable si:
- Añadimos `noindex` (meta + `robots.txt`) para que Google no la indexe, y usamos una URL de Vercel poco obvia.
- Las restricciones `CHECK` de la BD limitan longitudes, valores de enum, personas válidas y URLs `http(s)`.
- Las políticas RLS permiten `select/insert/update` en `plans`, pero `delete` **solo si `archived_at is not null`**. Así nadie puede borrar de golpe planes activos.
- Hay un botón **"Exportar JSON"** en Ajustes, como copia de seguridad manual. Conviene usarlo antes del viaje, porque el plan gratuito no ofrece backups descargables.
- Si más adelante quieres cerrarla, añadir un "código del viaje" comprobado en RLS es un cambio pequeño.

---

## 2. Modelo de datos (Supabase)

**`plans`**
| columna | tipo | notas |
|---|---|---|
| id | uuid pk | `gen_random_uuid()` |
| title | text | 1–120 caracteres, obligatorio |
| city | text | check en (`tokio`,`kioto`,`osaka`,`kawaguchiko`) |
| zone | text null | ≤ 60 |
| location | text null | dirección o enlace de Google Maps; si es una URL se abre directamente y, si no, se abre una búsqueda en Maps |
| price_amount | numeric(10,2) null | ≥ 0; null = "sin precio", 0 = gratis |
| price_currency | text | `JPY` / `EUR` |
| price_per | text | `persona` / `total` |
| duration_min | int null | 0–1440 |
| category | text | check en la lista fija |
| notes | text null | ≤ 2000 |
| owner | text | check en (Joseba, Filip, Gahona, Ander, Todos) |
| attendees | text[] | `<@ array[los 4]`. Por defecto [dueño], o los 4 si el dueño es "Todos" |
| votes | text[] | personas que marcan "me interesa mucho" |
| status | text | `idea` / `confirmado` / `hecho` |
| image_url | text null | solo `https://` |
| position | text | clave de **fractional indexing** para el orden manual |
| created_at / updated_at | timestamptz | `updated_at` lo rellena un trigger |
| created_by / updated_by | text | la persona del dispositivo |
| archived_at / archived_by | timestamptz / text null | archivado = no nulo |

**`settings`**: una sola fila (`eur_jpy numeric`, con un valor inicial aproximado que se edita en Ajustes).
**`plan_events`**: historial ligero que rellena un trigger (`plan_id, actor, action, changed_fields jsonb, at`). Se muestra como "Editado por Filip hace 2 h" y como historial dentro del detalle.
**`heartbeat`**: una fila que el cron de keep-alive actualiza.

**RPC atómicas** (para evitar que dos personas se pisen al modificar arrays a la vez): `toggle_attendee(plan_id, person)`, `toggle_vote(plan_id, person)`.

**Categorías fijas:** Comida, Templos y santuarios, Museos y arte, Compras, Naturaleza, Vida nocturna, Anime y ocio, Experiencias, Miradores, Otros.

---

## 3. Arquitectura del frontend

- **Rutas** (`react-router-dom`): `/` (planes), `/archivo`, `/ajustes`. El detalle se abre como hoja o panel con `?plan=<id>`, así que se puede compartir el enlace a un plan concreto.
- **Estado:** un `PlansProvider` (context + `useReducer`) que carga todos los planes una sola vez (son pocos, menos de 500). Aplica **actualizaciones optimistas** y fusiona los eventos de Realtime. No hace falta una librería de caché.
- **Búsqueda y filtros en el cliente:** la búsqueda ignora tildes y mayúsculas (`normalize('NFD')`) y mira título, zona, notas, dirección y categoría. Filtros: ciudad, categoría, estado, dueño, quién se apunta, "mis planes", rango de precio (convertido a una sola moneda), rango de duración y "con/sin imagen". Los filtros se reflejan en la URL (`?city=kioto&status=idea`).
- **Orden:** Manual (arrastrable) · Interés (votos) · Precio · Duración · Recientes. Solo se puede arrastrar en modo Manual. Si hay filtros activos, la nueva posición se calcula entre los vecinos visibles con fractional indexing, sin descolocar el resto de la lista.
- **Drag & drop:** `@dnd-kit/core` + `@dnd-kit/sortable`, con `PointerSensor` para ratón, `TouchSensor` para dedo (activación tras mantener pulsado 250 ms con tolerancia de 8 px, para no interferir con el scroll) y `KeyboardSensor` para accesibilidad. Hay un asa visible en cada tarjeta y `touch-action: none` solo en el asa.
- **Estilos:** CSS Modules + design tokens en variables CSS, sin Tailwind, para tener control total del look.
- **Layout:** mobile-first.
  - Móvil: cabecera con buscador, pestañas de ciudad deslizables, chips de filtro, lista de tarjetas, FAB "+", formulario en *bottom sheet* y navegación inferior (Planes · Archivo · Ajustes).
  - Escritorio (≥ 1024 px): 3 columnas (filtros a la izquierda, lista en el centro, detalle o edición a la derecha), atajos de teclado (`/` para buscar, `n` para un plan nuevo, `Esc` para cerrar) y un diálogo centrado en lugar del sheet.

### Estructura de archivos (final)
```
index.html · vite.config.js · package.json · vercel.json · .env.example · public/robots.txt
api/keepalive.js                       # función serverless que llama el cron de Vercel
supabase/migrations/001_schema.sql     # tablas, checks, RLS, triggers
supabase/migrations/002_covers.sql     # bucket de portadas + políticas de Storage
supabase/migrations/003_collab.sql     # RPC, plan_events, heartbeat, realtime
supabase/seed.sql                      # planes de ejemplo
src/main.jsx · src/App.jsx
src/lib/       supabase.js constants.js format.js search.js ordering.js storage.js
src/api/       plans.js settings.js
src/state/     PlansProvider.jsx
src/hooks/     useIdentity.js useFilters.js useRealtimePlans.js useMediaQuery.js
src/components/layout/   AppShell Header BottomNav
src/components/identity/ WhoAmI
src/components/plans/    PlanList PlanCard PlanDetail PlanForm SortableList
src/components/filters/  SearchBar CityTabs FilterChips FilterPanel SortMenu
src/components/ui/       Button Chip Sheet Dialog Toast PersonPicker DurationPicker PriceInput Stamp
src/pages/     PlansPage ArchivePage SettingsPage
src/styles/    tokens.css base.css fonts.css motion.css
src/**/*.test.js                       # Vitest junto a cada módulo de lib
```

---

## 4. Fases

### Fase 0 — Preparación (unos 30 min, la mayoría la haces tú)
- Crear el proyecto en Supabase (región `ap-northeast-1`, Tokio, para tener menos latencia durante el viaje; desde España la diferencia es asumible) y el proyecto en Vercel enlazado al repo de GitHub.
- Configurar `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `CRON_SECRET` en Vercel y en `.env.local`.
- **Archivos:** `package.json`, `vite.config.js`, `index.html`, `.env.example`, `.gitignore`, `vercel.json` (rewrite SPA), `public/robots.txt`.
- **Prueba:** `npm run dev` muestra un "hola"; el despliegue de prueba en Vercel funciona.

### Fase 1 — MVP funcional (CRUD + móvil y escritorio)
- Esquema `001_schema.sql` (tablas `plans` y `settings`, checks, RLS, trigger `updated_at`) y `seed.sql`.
- Archivos de `lib/`: `constants` (personas, ciudades, categorías, estados), `format` (precio y conversión, duración), `search` (normalizar y filtrar), `storage` (localStorage con try/catch).
- `api/plans.js`: listar, crear, actualizar, archivar, restaurar y borrar definitivamente.
- `PlansProvider`, `useIdentity`, `useFilters`.
- Componentes funcionales con estilo oscuro básico: `WhoAmI`, `PlanList`, `PlanCard`, `PlanDetail`, `PlanForm` (validación inline), `SearchBar`, `CityTabs`, `FilterChips`/`FilterPanel`, `SortMenu` (sin el modo manual todavía), `ArchivePage`, `SettingsPage` (tipo de cambio, cambiar identidad, exportar JSON), `Toast` con **"Deshacer"** al archivar.
- Layout responsive móvil/escritorio (`AppShell`, `Sheet`, `Dialog`, `BottomNav`).
- **Prueba:**
  - Vitest para `format`, `search` y `constants` (conversión ¥↔€, formato de duración, búsqueda sin tildes, combinaciones de filtros).
  - Manual: crear, editar, archivar, deshacer, restaurar y borrar definitivamente; comprobar que un `delete` sobre un plan no archivado falla (con una prueba en el SQL editor).
  - En un móvil real: `npm run dev -- --host` y abrir `http://<IP-del-PC>:5173` en el móvil conectado a la misma wifi (permitir Node en el firewall de Windows). Además, abrir la *preview* de Vercel por HTTPS.

### Fase 1.5 — Portada del plan (adelantada desde la Fase 4)
Decisiones: **subir foto o pegar URL**, **banda 16:9 en la parte superior de la tarjeta** y **recorte automático** por el centro (`object-fit: cover`).

- **Almacenamiento:** un bucket público `covers` en Supabase Storage (1 GB gratis), creado en `002_covers.sql`. El propio Supabase limita cada archivo a **1 MB** y a los tipos `image/webp` y `image/jpeg`. Las políticas RLS permiten subir, leer y borrar solo dentro de `covers`; es tan abierto como el resto de la app.
- **Compresión en el navegador**, antes de subir nada:
  - `createImageBitmap` respeta la orientación EXIF de las fotos del móvil y un `<canvas>` las redimensiona.
  - Se generan **dos versiones** en WebP: la grande para el detalle (máximo 1600 px, unos 150–300 KB) y la pequeña para las tarjetas (800 px, unos 50 KB). Si el navegador no sabe crear WebP, se usan JPEG.
  - Las tarjetas usan `srcset`, así que en el móvil solo se descarga la pequeña: unos 2 MB para 40 planes en vez de 10 MB. Importa en Japón con datos móviles. (Supabase solo transforma imágenes en el plan de pago, por eso las generamos nosotros.)
  - Las fotos del iPhone se eligen desde la galería y iOS las convierte de HEIC a JPEG solo. Si el navegador no puede leer el formato, se muestra un error claro.
- **Subida al guardar**, no al elegir la foto:
  - La vista previa usa la imagen local, así que si cancelas el formulario no queda nada huérfano en Storage.
  - Si falla el guardado del plan, se borra lo que se acaba de subir.
  - Al sustituir o quitar una portada, o al borrar un plan definitivamente, se borran sus dos archivos.
- **URL pegada:** solo `https://`, con vista previa y un aviso si no carga. Se guarda en la columna `image_url`, que ya existe, así que no hay que cambiar la tabla `plans`.
- **Sin dependencia nueva:** la subida y el borrado llaman a la API REST de Storage con `fetch`. La librería `storage-js` pesaba unos 110 kB.
- **Vista:**
  - En la tarjeta, banda 16:9 arriba con `loading="lazy"`, `decoding="async"` y `aspect-ratio` fijo para que la página no salte al cargar. Si la imagen falla, la banda desaparece.
  - En el detalle, la portada grande arriba.
- **Archivos:**
  - Nuevos: `supabase/migrations/002_covers.sql`, `src/lib/covers.js` y su test (tamaños, rutas y URLs, `srcset`), `src/lib/imageCompress.js`, `src/api/covers.js`, `src/components/ui/CoverPicker.jsx` y su `.module.css`, `src/components/plans/PlanCover.jsx` y su `.module.css`.
  - Modificados: `PlanForm`, `PlanCard`, `PlanDetail`, `planValues.js` (campo y validación), `PlansProvider.destroy` (borrar los archivos) y `lib/supabase.js` (exportar la URL y la clave).
- **Prueba:**
  - Vitest para `covers.js` y la validación de la URL.
  - Con `curl`, comprobar que la clave pública puede subir y borrar en `covers`, y que un PNG o un archivo de más de 1 MB se rechazan.
  - Manual: subir desde la galería del móvil (iPhone y Android) y desde el PC; pegar una URL buena y otra rota; sustituir y quitar la portada, y comprobar en *Storage* que no quedan huérfanos; en DevTools → Network con perfil móvil, ver que las tarjetas cargan la versión `-sm`.

### Fase 2 — Colaboración y keep-alive
- `003_collab.sql`: RPC `toggle_attendee`/`toggle_vote`, `plan_events` con trigger, `heartbeat`, y la tabla `plans` añadida a la publicación de Realtime.
- `useRealtimePlans` (suscripción a `postgres_changes`, fusión con el estado y reconexión al volver a la pestaña).
- `lib/ordering.js` (fractional indexing con la librería `fractional-indexing`) y `SortableList` con dnd-kit para el orden manual.
- Botones "me apunto" y "me interesa", el historial en `PlanDetail` y el indicador "editado por X".
- **Keep-alive:** `api/keepalive.js` + `vercel.json` → `"crons": [{ "path": "/api/keepalive", "schedule": "0 8 * * *" }]`. Vercel Hobby permite un cron diario. La función comprueba `Authorization: Bearer ${CRON_SECRET}` y hace un *upsert* en `heartbeat`. Es una escritura real, así que cuenta como actividad. Una vez al día da mucho margen frente a los 7 días que tarda Supabase en pausar el proyecto.
  - Por qué no GitHub Actions: los workflows programados se desactivan solos tras 60 días sin commits en el repo, y faltan 7 meses.
  - Plan B: si el proyecto se pausara, se restaura con un clic desde el panel de Supabase (los datos se conservan). Antes del viaje: revisar los logs del cron y exportar el JSON.
  - Durante el viaje, el propio uso diario ya mantiene el proyecto activo.
- **Prueba:**
  - Vitest para `ordering` (insertar al principio, al final y entre dos; muchas inserciones seguidas).
  - Dos navegadores (o PC + móvil) a la vez: un cambio en uno aparece en el otro en menos de 1 s; dos personas apuntándose a la vez no se pisan.
  - Arrastrar con ratón, con el dedo (en un móvil real: el scroll sigue funcionando y la pulsación larga sobre el asa arrastra) y con teclado; el orden persiste tras recargar.
  - Cron: llamar `/api/keepalive` con el secreto (200) y sin él (401); ver la ejecución en el panel de Crons de Vercel.

### Fase 3 — Capa visual "Sumi & Washi nocturno" y micro-interacciones
- **Tokens** (`tokens.css`):
  - Oscuro: tinta sumi (#0f1014, con un leve tono índigo), papel apagado, bermellón torii como acento principal, dorado kintsugi como acento secundario y un color por ciudad.
  - Claro: papel washi crema con tinta sumi y los mismos acentos.
  - Tema: Sistema / Oscuro / Claro en Ajustes, con oscuro por defecto y aplicado antes del primer pintado para evitar el parpadeo.
- **Tipografía** (con `@fontsource`, autoalojada y troceada por `unicode-range`, de modo que solo se descargan los glifos usados): *Shippori Mincho* para titulares y kanji decorativos (東京 · 京都 · 大阪 · 河口湖) y *Zen Kaku Gothic New* para el texto.
- **Textura washi:** un PNG pequeño de ruido (menos de 10 KB) en un pseudo-elemento fijo, sin filtros SVG en tiempo de ejecución.
- **Micro-interacciones** (solo con `transform`/`opacity`, que funcionan bien en móviles de gama media):
  - **Sello hanko** que "se estampa" (escala + leve rotación + mancha de tinta) al pasar un plan a *confirmado*; un sello tachado para *hecho*.
  - **Trazo de pincel** SVG (`stroke-dashoffset`) bajo la ciudad o el filtro activo.
  - Tarjeta que se levanta al arrastrar (sombra y escala) y huecos que se abren suavemente.
  - Avatares de "se apuntan" que aparecen con un pequeño rebote; vibración corta (`navigator.vibrate`, en Android) al apuntarse o soltar.
  - Al filtrar, las tarjetas entran escalonadas; el *bottom sheet* se puede cerrar arrastrándolo hacia abajo con el dedo; el toast "Deshacer" tiene una barra de tiempo con forma de pincelada.
  - Estados vacíos ilustrados (un enso, el círculo zen) y skeletons con brillo de tinta.
- **Librería:** `motion` con `LazyMotion` + `domAnimation` (unos 15 KB) para el sheet y las transiciones de presencia; el resto con CSS. `MotionConfig reducedMotion="user"` y `@media (prefers-reduced-motion: reduce)` en `motion.css`: con movimiento reducido, las animaciones se convierten en fundidos cortos o se quitan, y se desactivan el escalonado, el rebote y la vibración.
- **Rendimiento:** `content-visibility: auto` en las tarjetas, `will-change` solo durante el arrastre, imágenes con `loading="lazy"` y `aspect-ratio` fijo, y nada de `backdrop-filter` en elementos con scroll en móvil.
- **Archivos:** `styles/*`, `ui/Stamp.jsx`, ajustes en todos los componentes de la Fase 1 y `public/textures/washi.png`.
- **Prueba:**
  - DevTools con *CPU 4× slowdown* y perfil "Mid-tier mobile": arrastrar y filtrar sin caídas de frames visibles (Performance panel, sin *long tasks* de más de 50 ms al interactuar).
  - Lighthouse móvil: Performance ≥ 90 y Accesibilidad ≥ 95.
  - Emular `prefers-reduced-motion` en DevTools y probarlo en el móvil real (iOS: *Reducir movimiento*; Android: *Quitar animaciones*).
  - Contraste AA en ambos temas.

### Fase 4 — PWA sin conexión, imágenes y pulido
- `vite-plugin-pwa`: manifest (icono 旅, `theme_color` sumi), *service worker* que precachea la app y una instantánea de los planes en IndexedDB/localStorage para consultarlos **sin conexión en modo solo lectura**. Sin conexión aparece una insignia "Sin conexión" y los botones de escritura se desactivan.
- (La imagen de portada se adelantó a la Fase 1.5.)
- Detalles finales: atajos de teclado en escritorio, enlaces "Abrir en Maps", contador de planes y suma de duración y coste estimado de lo filtrado.
- **Prueba:**
  - Instalar la app en la pantalla de inicio desde la URL de Vercel (Android Chrome e iOS Safari → "Añadir a inicio").
  - Activar el modo avión: la app abre y muestra los planes. Al volver la conexión, se sincroniza.
  - Lighthouse PWA.

---

## 5. Verificación global (antes del viaje)
1. `npm run test` (Vitest) en verde y `npm run build` sin avisos.
2. Recorrido completo en el móvil de cada uno de los 4 (iOS y Android si los hay): elegir identidad, crear, apuntarse, votar, reordenar, archivar, restaurar y borrar.
3. Edición simultánea entre dos personas (comprobar el tiempo real y el orden).
4. Revisar que el cron de keep-alive lleva semanas ejecutándose sin fallos y exportar el JSON de seguridad.
5. Prueba de campo sin conexión (modo avión) con la PWA instalada.
