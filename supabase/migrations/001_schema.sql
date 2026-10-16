-- 001 · Esquema base: planes, ajustes, RLS
-- Ejecutar en Supabase → SQL Editor (una sola vez).

-- ───────────────────────── plans ─────────────────────────
create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(btrim(title)) between 1 and 120),
  city           text not null check (city in ('tokio', 'kioto', 'osaka', 'kawaguchiko')),
  zone           text check (zone is null or char_length(zone) <= 60),
  location       text check (location is null or char_length(location) <= 500),
  price_amount   numeric(10, 2) check (price_amount is null or price_amount >= 0),
  price_currency text not null default 'JPY' check (price_currency in ('JPY', 'EUR')),
  price_per      text not null default 'persona' check (price_per in ('persona', 'total')),
  duration_min   integer check (duration_min is null or duration_min between 0 and 1440),
  category       text not null check (category in (
                   'comida', 'templos', 'museos', 'compras', 'naturaleza',
                   'noche', 'anime', 'experiencias', 'miradores', 'otros')),
  notes          text check (notes is null or char_length(notes) <= 2000),
  owner          text not null check (owner in ('Joseba', 'Filip', 'Gahona', 'Ander', 'Todos')),
  attendees      text[] not null default '{}'
                   check (attendees <@ array['Joseba', 'Filip', 'Gahona', 'Ander']::text[]),
  votes          text[] not null default '{}'
                   check (votes <@ array['Joseba', 'Filip', 'Gahona', 'Ander']::text[]),
  status         text not null default 'idea' check (status in ('idea', 'confirmado', 'hecho')),
  image_url      text check (image_url is null or (image_url ~ '^https://' and char_length(image_url) <= 1000)),
  -- Clave de "fractional indexing": el orden manual compartido. Collate "C" = orden ASCII.
  position       text collate "C" not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     text check (created_by in ('Joseba', 'Filip', 'Gahona', 'Ander')),
  updated_by     text check (updated_by in ('Joseba', 'Filip', 'Gahona', 'Ander')),
  archived_at    timestamptz,
  archived_by    text check (archived_by in ('Joseba', 'Filip', 'Gahona', 'Ander'))
);

create index if not exists plans_position_idx on public.plans (position);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists plans_touch_updated_at on public.plans;
create trigger plans_touch_updated_at
  before update on public.plans
  for each row execute function public.touch_updated_at();

-- ───────────────────────── settings ─────────────────────────
create table if not exists public.settings (
  id         smallint primary key default 1 check (id = 1),
  eur_jpy    numeric(8, 3) not null default 165 check (eur_jpy > 0 and eur_jpy < 1000),
  updated_at timestamptz not null default now(),
  updated_by text check (updated_by in ('Joseba', 'Filip', 'Gahona', 'Ander'))
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

drop trigger if exists settings_touch_updated_at on public.settings;
create trigger settings_touch_updated_at
  before update on public.settings
  for each row execute function public.touch_updated_at();

-- ───────────────────────── Permisos ─────────────────────────
-- Acceso abierto (sin login), pero:
--  · solo se puede borrar un plan que ya esté archivado
--  · los ajustes no se pueden crear ni borrar, solo leer y actualizar
grant select, insert, update, delete on public.plans to anon, authenticated;
grant select, update on public.settings to anon, authenticated;

alter table public.plans enable row level security;
alter table public.settings enable row level security;

drop policy if exists plans_select on public.plans;
drop policy if exists plans_insert on public.plans;
drop policy if exists plans_update on public.plans;
drop policy if exists plans_delete_archived on public.plans;

create policy plans_select on public.plans for select to anon, authenticated using (true);
create policy plans_insert on public.plans for insert to anon, authenticated with check (true);
create policy plans_update on public.plans for update to anon, authenticated using (true) with check (true);
create policy plans_delete_archived on public.plans for delete to anon, authenticated
  using (archived_at is not null);

drop policy if exists settings_select on public.settings;
drop policy if exists settings_update on public.settings;

create policy settings_select on public.settings for select to anon, authenticated using (true);
create policy settings_update on public.settings for update to anon, authenticated using (true) with check (true);
