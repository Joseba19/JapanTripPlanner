-- 002 · Portadas de los planes en Supabase Storage
-- Ejecutar en Supabase → SQL Editor (una sola vez).

-- Bucket público: las imágenes se sirven por URL sin autenticación.
-- Supabase rechaza en el servidor lo que pase de 1 MB o no sea WebP/JPEG.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Acceso abierto como el resto de la app, pero solo dentro de "covers"
-- y con nombres generados por la app (<id>.webp y <id>-sm.webp, sin carpetas).
drop policy if exists covers_select on storage.objects;
drop policy if exists covers_insert on storage.objects;
drop policy if exists covers_delete on storage.objects;

create policy covers_select on storage.objects for select to anon, authenticated
  using (bucket_id = 'covers');

create policy covers_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'covers' and name ~ '^[a-z0-9-]+\.(webp|jpg)$');

create policy covers_delete on storage.objects for delete to anon, authenticated
  using (bucket_id = 'covers');
