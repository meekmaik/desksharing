-- ============================================================
-- Komplettes Schema für die Arbeitsplatz-Buchung (mit Login)
-- Einmal komplett im Supabase SQL-Editor ausführen.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- Profile (Anzeigename + Admin-Kennzeichen) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profile sind für alle lesbar" on public.profiles
  for select using (true);

create policy "Nutzer darf eigenes Profil ändern" on public.profiles
  for update using (auth.uid() = id);

-- Automatisch ein Profil anlegen, sobald sich jemand registriert.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Buchungen ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id text not null,
  date date not null,
  start_time time,
  end_time time,
  name text not null,
  user_id uuid not null references auth.users (id),
  series_id uuid,
  created_at timestamptz not null default now(),
  constraint chk_time_range check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index idx_bookings_date on public.bookings (date);
create index idx_bookings_series on public.bookings (series_id);

-- Ganztägige Buchungen: pro Tag und Tisch nur EINE Buchung.
create unique index uniq_fullday_booking
  on public.bookings (resource_id, date)
  where start_time is null;

-- Überschneidungsschutz für den zeitbasierten Besprechungsraum.
create or replace function public.prevent_overlapping_bookings()
returns trigger as $$
begin
  if new.start_time is not null then
    if exists (
      select 1 from public.bookings b
      where b.resource_id = new.resource_id
        and b.date = new.date
        and b.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and b.start_time is not null
        and (new.start_time, new.end_time) overlaps (b.start_time, b.end_time)
    ) then
      raise exception 'Zeitraum überschneidet sich mit einer bestehenden Buchung.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_prevent_overlap
before insert or update on public.bookings
for each row execute function public.prevent_overlapping_bookings();

-- ---------- Zugriffsregeln: nur eingeloggte Nutzer ----------
alter table public.bookings enable row level security;

create policy "Eingeloggte dürfen lesen" on public.bookings
  for select using (auth.role() = 'authenticated');

create policy "Nur für sich selbst buchen" on public.bookings
  for insert with check (auth.uid() = user_id);

create policy "Nur eigene Buchung stornieren" on public.bookings
  for delete using (auth.uid() = user_id);

-- ---------- Realtime aktivieren ----------
alter publication supabase_realtime add table public.bookings;
