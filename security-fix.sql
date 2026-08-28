-- ============================================================
-- SICHERHEITS-FIXES – einmal im Supabase SQL-Editor ausführen.
--
-- Behebt drei Lücken:
--  1) Nutzer konnten sich selbst zum Admin machen
--  2) Nutzer konnten unter fremdem Namen buchen
--  3) Nutzer konnten Buchungen für beliebige Daten anlegen
-- ============================================================

-- ------------------------------------------------------------
-- 1) Rechteausweitung verhindern
-- Bisher durfte jeder sein eigenes Profil ändern – inklusive der
-- Spalte is_admin. Damit hätte sich jede Person selbst zum Admin
-- machen können. Ein Trigger schreibt is_admin jetzt immer auf den
-- alten Wert zurück, außer ein echter Admin führt die Änderung durch.
-- ------------------------------------------------------------
create or replace function public.protect_admin_flag()
returns trigger as $$
declare
  caller_is_admin boolean;
begin
  select p.is_admin into caller_is_admin
  from public.profiles p
  where p.id = auth.uid();

  if new.is_admin is distinct from old.is_admin
     and coalesce(caller_is_admin, false) = false then
    new.is_admin := old.is_admin;
  end if;

  -- Die Nutzer-ID darf nie geändert werden.
  new.id := old.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_protect_admin_flag on public.profiles;
create trigger trg_protect_admin_flag
before update on public.profiles
for each row execute function public.protect_admin_flag();

-- ------------------------------------------------------------
-- 2) Buchungsnamen serverseitig erzwingen
-- Bisher hat die App den Namen mitgeschickt. Über die API hätte man
-- damit unter beliebigem fremdem Namen buchen können. Jetzt setzt die
-- Datenbank den Namen immer selbst aus dem Profil der buchenden Person.
-- ------------------------------------------------------------
create or replace function public.set_booking_name()
returns trigger as $$
begin
  select coalesce(p.display_name, 'Unbekannt') into new.name
  from public.profiles p
  where p.id = new.user_id;

  if new.name is null then
    new.name := 'Unbekannt';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists trg_set_booking_name on public.bookings;
create trigger trg_set_booking_name
before insert or update on public.bookings
for each row execute function public.set_booking_name();

-- ------------------------------------------------------------
-- 3) Buchungszeitraum begrenzen
-- Buchungen sind nur noch von heute bis 30 Tage in die Zukunft
-- möglich (die App zeigt 14 Werktage, der Puffer fängt Feiertage ab).
-- Verhindert, dass jemand über die API den Kalender zumüllt.
-- ------------------------------------------------------------
drop policy if exists "Nur für sich selbst buchen" on public.bookings;

create policy "Nur für sich selbst buchen" on public.bookings
  for insert with check (
    auth.uid() = user_id
    and date >= current_date
    and date <= current_date + interval '30 days'
  );

-- ------------------------------------------------------------
-- 4) Aufräumen: abgelaufene Buchungen können jederzeit gelöscht werden,
-- indem du diese Zeile bei Bedarf ausführst (optional, nicht nötig).
-- delete from public.bookings where date < current_date - interval '90 days';
-- ------------------------------------------------------------
