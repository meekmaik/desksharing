-- ============================================================
-- Nur EIN Platz pro Tag und Person (Besprechungsraum ausgenommen,
-- da dieser zeitbasiert ist und start_time gesetzt hat).
-- Einmal im Supabase SQL-Editor ausführen.
-- ============================================================
create unique index if not exists uniq_one_fullday_booking_per_user
  on public.bookings (user_id, date)
  where start_time is null;
