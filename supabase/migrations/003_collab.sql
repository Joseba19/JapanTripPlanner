-- 003 · Colaboración: apuntarse y votar sin pisarse, historial, tiempo real y keep-alive
-- Ejecutar en Supabase → SQL Editor (una sola vez).

-- ───────────── Apuntarse / votar (atómico: dos personas a la vez no se pisan) ─────────────
create or replace function public.toggle_attendee(p_plan_id uuid, p_person text)
returns public.plans
language sql
security invoker
set search_path = ''
as $$
  update public.plans
     set attendees = case when p_person = any (attendees)
                          then array_remove(attendees, p_person)
                          else array_append(attendees, p_person) end,
         updated_by = p_person
   where id = p_plan_id
  returning *;
$$;

create or replace function public.toggle_vote(p_plan_id uuid, p_person text)
returns public.plans
language sql
security invoker
set search_path = ''
as $$
  update public.plans
     set votes = case when p_person = any (votes)
                      then array_remove(votes, p_person)
                      else array_append(votes, p_person) end,
         updated_by = p_person
   where id = p_plan_id
  returning *;
$$;

grant execute on function public.toggle_attendee(uuid, text) to anon, authenticated;
grant execute on function public.toggle_vote(uuid, text) to anon, authenticated;

-- ───────────── Historial de cambios ─────────────
create table if not exists public.plan_events (
  id      bigint generated always as identity primary key,
  plan_id uuid not null references public.plans (id) on delete cascade,
  actor   text,
  action  text not null,
  detail  jsonb,
  at      timestamptz not null default now()
);

create index if not exists plan_events_plan_idx on public.plan_events (plan_id, at desc);

-- Lo rellena solo el trigger: desde la app solo se puede leer
grant select on public.plan_events to anon, authenticated;
alter table public.plan_events enable row level security;
drop policy if exists plan_events_select on public.plan_events;
create policy plan_events_select on public.plan_events for select to anon, authenticated using (true);

create or replace function public.log_plan_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed text[];
  action  text;
  detail  jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.plan_events (plan_id, actor, action) values (new.id, new.created_by, 'create');
    return new;
  end if;

  select coalesce(array_agg(key order by key), '{}')
    into changed
    from jsonb_each(to_jsonb(new)) as n(key, value)
   where n.value is distinct from (to_jsonb(old) -> n.key)
     and n.key not in ('updated_at', 'updated_by');

  if changed = '{}' or changed = array['position'] then
    return new; -- reordenar no se apunta en el historial
  elsif old.archived_at is null and new.archived_at is not null then
    action := 'archive';
  elsif old.archived_at is not null and new.archived_at is null then
    action := 'restore';
  elsif changed = array['attendees'] then
    action := case when cardinality(new.attendees) > cardinality(old.attendees) then 'attend' else 'unattend' end;
  elsif changed = array['votes'] then
    action := case when cardinality(new.votes) > cardinality(old.votes) then 'vote' else 'unvote' end;
  elsif changed = array['status'] then
    action := 'status';
    detail := jsonb_build_object('status', new.status);
  else
    action := 'update';
    detail := jsonb_build_object('fields', to_jsonb(array_remove(changed, 'position')));
  end if;

  insert into public.plan_events (plan_id, actor, action, detail) values (new.id, new.updated_by, action, detail);
  return new;
end;
$$;

drop trigger if exists plans_log_event on public.plans;
create trigger plans_log_event
  after insert or update on public.plans
  for each row execute function public.log_plan_event();

-- ───────────── Keep-alive (el cron diario de Vercel llama a heartbeat) ─────────────
create table if not exists public.heartbeat (
  id      smallint primary key default 1 check (id = 1),
  beat_at timestamptz not null default now(),
  source  text
);

alter table public.heartbeat enable row level security; -- sin políticas: solo vía la función

create or replace function public.heartbeat(p_source text default 'manual')
returns timestamptz
language sql
security definer
set search_path = ''
as $$
  insert into public.heartbeat (id, beat_at, source) values (1, now(), left(p_source, 40))
  on conflict (id) do update set beat_at = excluded.beat_at, source = excluded.source
  returning beat_at;
$$;

grant execute on function public.heartbeat(text) to anon, authenticated;

-- ───────────── Tiempo real ─────────────
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'plans') then
    alter publication supabase_realtime add table public.plans;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end;
$$;
