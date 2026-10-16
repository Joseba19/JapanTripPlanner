# 旅 · Japón '27

Planificador de actividades para el viaje a Japón de cuatro amigos (Joseba, Filip, Gahona y Ander) en mayo de 2027. Cada uno añade planes, ve los de los demás, se apunta, vota y los ordena, desde el móvil o el ordenador y sin necesidad de cuenta.

Es un proyecto personal y no comercial. Las decisiones de diseño y el historial de fases están en [`PLAN.md`](PLAN.md).

## Qué hace

- **Planes** en Tokio, Kioto, Osaka y Kawaguchiko, con categoría, zona, dirección, precio (en ¥ o €, por persona o total), duración, notas, estado (idea, confirmado o hecho) y foto de portada.
- **Sin login:** cada dispositivo elige una vez quién es. Cualquiera puede editar cualquier plan y queda registrado quién cambió qué (historial en cada plan).
- **Colaboración en tiempo real:** los cambios de uno aparecen al instante en los demás. Botones «Me apunto» y «Me interesa».
- **Búsqueda y filtros** por ciudad, categoría, estado, persona, precio y duración (la búsqueda no distingue tildes ni mayúsculas). Los filtros quedan en la URL para poder compartirlos. Encima de la lista se muestran el número de planes, la duración total y el coste estimado por persona de lo filtrado.
- **Orden del grupo** arrastrando las tarjetas, también con el dedo y con el teclado.
- **Mapa** con los planes que tienen un enlace de Google Maps en la dirección. Acepta enlaces largos y los cortos de «Compartir» (`maps.app.goo.gl`).
- **Archivo:** archivar en lugar de borrar, con «Deshacer». Desde el Archivo se puede restaurar o borrar definitivamente.
- **Tipo de cambio** euro/yen compartido, editable en Ajustes, y exportación de todo a JSON como copia de seguridad.
- **App instalable (PWA)** que abre sin conexión en modo solo lectura, con la última copia de los planes y las zonas del mapa ya vistas.
- Tema oscuro («Sumi & Washi») y claro. En el ordenador hay atajos de teclado: `/` busca, `n` crea un plan, `m` cambia entre lista y mapa, y `Esc` cierra.

## Tecnología

- **Frontend:** React 19 + Vite 7 (JavaScript), React Router, CSS Modules con variables CSS.
- **Datos:** Supabase (Postgres, Realtime y Storage), llamado directamente desde el navegador con los clientes ligeros `postgrest-js` y `realtime-js`, no con el SDK completo.
- **Mapa:** MapLibre GL con [OpenFreeMap](https://openfreemap.org) (estilo Liberty; datos © OpenStreetMap).
- **Despliegue:** Vercel Hobby, con dos funciones serverless en `api/`: el keep-alive diario de Supabase y la resolución de enlaces de Google Maps.
- **PWA:** `vite-plugin-pwa` (Workbox).
- **Tests:** Vitest, para la lógica pura de `src/lib/`.

## Puesta en marcha

Requisitos: Node 20.19 o superior y un proyecto de Supabase.

1. **Base de datos.** En Supabase → SQL Editor, ejecuta en este orden:
   1. `supabase/migrations/001_schema.sql`: tablas, restricciones y RLS.
   2. `supabase/migrations/002_covers.sql`: bucket `covers` para las portadas.
   3. `supabase/migrations/003_collab.sql`: votos y apuntados atómicos, historial, keep-alive y Realtime.
   4. Opcional: `supabase/seed.sql`, con planes de ejemplo.
2. **Variables de entorno.** Copia `.env.example` a `.env.local` y rellénalo con la URL y la clave pública del proyecto (Supabase → Project Settings → API).
3. **Arrancar:**

   ```bash
   npm install
   npm run dev                 # http://localhost:5173
   npm run dev -- --host       # para abrirla desde el móvil en la misma wifi
   ```

## Comandos

```bash
npm run dev          # servidor de desarrollo (incluye /api/geocode)
npm run build        # build de producción en dist/
npm run preview      # sirve dist/ (aquí sí se registra el service worker)
npm test             # tests (Vitest)
npx vitest run src/lib/geo.test.js   # un solo archivo de tests
```

Scripts de recursos, solo si cambian:

```bash
node scripts/make-washi.mjs                      # textura de papel washi
python scripts/subset-fonts.py <ShipporiMincho-SemiBold.ttf>   # recorta la fuente al añadir kanji nuevos
python scripts/make-icons.py                     # iconos de la PWA (requiere Pillow)
```

Sin las variables de Supabase, la app muestra una pantalla pidiendo configurarlas, y `npm run build` genera solo esa pantalla.

## Despliegue

Cada push a `main` lo despliega Vercel automáticamente. En Vercel hacen falta estas variables:

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave pública de Supabase |
| `CRON_SECRET` | Protege `/api/keepalive`, que Vercel Cron llama cada día para que Supabase (plan gratuito) no se pause tras 7 días sin actividad |

## Sobre la seguridad

La app es abierta a propósito: la clave pública de Supabase va en el código del navegador, así que cualquiera con la URL puede leer y escribir. Para un grupo de amigos se considera aceptable, con estas mitigaciones:

- La web no se indexa (`noindex` y `robots.txt`).
- La base de datos valida longitudes, valores y personas.
- Solo se pueden borrar planes que ya estén archivados.
- En Ajustes hay una exportación a JSON para tener copias de seguridad.

## Estructura

```
api/                  funciones de Vercel (keepalive, geocode)
public/               favicon, iconos de la PWA, fuente recortada y texturas
scripts/              generadores de recursos (textura, fuente, iconos)
supabase/             migraciones SQL y datos de ejemplo
src/
  api/                acceso a Supabase (planes, ajustes, portadas)
  state/              PlansProvider: estado global, cambios optimistas, tiempo real y modo sin conexión
  hooks/              identidad, filtros en la URL, tema, ubicaciones del mapa, service worker…
  lib/                lógica pura con tests (formato, búsqueda, orden, enlaces de Maps…)
  components/         filtros, planes, mapa, layout y componentes de interfaz
  pages/              Planes, Archivo y Ajustes
  styles/             tokens de diseño, base, fuentes y animaciones
```
