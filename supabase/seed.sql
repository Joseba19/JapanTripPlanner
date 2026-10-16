-- Planes de ejemplo (opcional). Ejecutar después de 001_schema.sql.
-- Se pueden archivar y borrar desde la app cuando ya no hagan falta.
insert into public.plans
  (title, city, zone, location, price_amount, price_currency, price_per, duration_min,
   category, notes, owner, attendees, status, position, created_by, updated_by)
values
  ('Fushimi Inari al amanecer', 'kioto', 'Fushimi', 'https://maps.google.com/?q=Fushimi+Inari+Taisha',
   0, 'JPY', 'persona', 180, 'templos', 'Ir antes de las 7:00 para evitar multitudes.',
   'Todos', array['Joseba','Filip','Gahona','Ander'], 'confirmado', 'a0', 'Joseba', 'Joseba'),
  ('teamLab Planets', 'tokio', 'Toyosu', 'teamLab Planets TOKYO, Toyosu',
   3800, 'JPY', 'persona', 120, 'experiencias', 'Reservar entradas con antelación. Se va descalzo.',
   'Filip', array['Filip','Ander'], 'idea', 'a1', 'Filip', 'Filip'),
  ('Cena de street food en Dotonbori', 'osaka', 'Namba', 'Dotonbori, Osaka',
   3000, 'JPY', 'persona', 120, 'comida', 'Takoyaki, okonomiyaki y kushikatsu.',
   'Gahona', array['Gahona','Joseba','Filip'], 'idea', 'a2', 'Gahona', 'Gahona'),
  ('Pagoda Chureito con el Fuji', 'kawaguchiko', 'Fujiyoshida', 'Chureito Pagoda',
   0, 'JPY', 'persona', 120, 'miradores', 'Unas 400 escaleras. Mejor por la mañana, con el cielo despejado.',
   'Ander', array['Ander','Joseba'], 'idea', 'a3', 'Ander', 'Ander'),
  ('Golden Gai', 'tokio', 'Shinjuku', 'Golden Gai, Shinjuku',
   25, 'EUR', 'persona', 150, 'noche', 'Algunos bares cobran entrada (cover charge).',
   'Joseba', array['Joseba','Gahona'], 'idea', 'a4', 'Joseba', 'Joseba'),
  ('Bosque de bambú de Arashiyama', 'kioto', 'Arashiyama', 'Arashiyama Bamboo Grove',
   null, 'JPY', 'persona', 90, 'naturaleza', null,
   'Todos', array['Joseba','Filip','Gahona','Ander'], 'idea', 'a5', 'Filip', 'Filip'),
  ('Shibuya Sky al atardecer', 'tokio', 'Shibuya', 'SHIBUYA SKY',
   2500, 'JPY', 'persona', 60, 'miradores', 'Las entradas para la hora del atardecer se agotan rápido.',
   'Ander', array['Ander'], 'idea', 'a6', 'Ander', 'Ander'),
  ('Akihabara: retro games y arcades', 'tokio', 'Akihabara', 'Super Potato, Akihabara',
   10000, 'JPY', 'persona', 240, 'anime', null,
   'Gahona', array['Gahona','Filip'], 'idea', 'a7', 'Gahona', 'Gahona');
