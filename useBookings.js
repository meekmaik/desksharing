import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import { RESOURCES } from "./floorplanData";
import { getBookingHorizon } from "./dateUtils";
import { BOOKING_DAYS, DAY_ROLLOVER_CHECK_MS } from "./config";

/** Anzahl ganztägig buchbarer Plätze (Besprechungsraum zählt nicht mit). */
export const FULLDAY_RESOURCE_COUNT = RESOURCES.filter((r) => !r.timeBased).length;

/**
 * Lädt die Buchungen des aktuellen Zeitraums, hält sie per Live-Verbindung
 * aktuell und stellt daraus abgeleitete Werte bereit.
 *
 * @param {string|null} userId Angemeldete Person, oder null.
 * @param {(msg: string) => void} onToast Kurze Rückmeldung anzeigen.
 */
export function useBookings(userId, onToast) {
  const [horizon, setHorizon] = useState(() => getBookingHorizon(BOOKING_DAYS));
  const [selectedDateKey, setSelectedDateKey] = useState(() => horizon[0].key);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---- Tageswechsel ----
  // Bleibt der Tab über Mitternacht offen, wäre der erste Tag sonst gestern
  // und Buchungen würden von der Datenbank abgelehnt.
  useEffect(() => {
    const refresh = () => {
      setHorizon((prev) => {
        const next = getBookingHorizon(BOOKING_DAYS);
        return next[0].key === prev[0].key ? prev : next;
      });
    };
    const timer = setInterval(refresh, DAY_ROLLOVER_CHECK_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  // Ist der gewählte Tag durch den Tageswechsel aus dem Zeitraum gefallen,
  // auf den ersten gültigen Tag zurückspringen.
  useEffect(() => {
    if (!horizon.some((d) => d.key === selectedDateKey)) {
      setSelectedDateKey(horizon[0].key);
    }
  }, [horizon, selectedDateKey]);

  // ---- Laden ----
  const reload = useCallback(async () => {
    if (!supabase || !userId) {
      setAllBookings([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .gte("date", horizon[0].key)
      .lte("date", horizon[horizon.length - 1].key);

    if (error) onToast?.("Buchungen konnten nicht geladen werden.");
    else setAllBookings(data || []);
    setLoading(false);
  }, [horizon, userId, onToast]);

  useEffect(() => {
    reload();
    if (!supabase || !userId) return;

    // Nach längerem Standby kann die Live-Verbindung still gestorben sein --
    // beim Zurückkehren zum Tab deshalb sicherheitshalber neu laden.
    const onFocus = () => reload();
    window.addEventListener("focus", onFocus);

    const channel = supabase
      .channel("bookings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, reload)
      .subscribe();

    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [reload, userId]);

  // ---- Abgeleitete Werte ----

  /** Buchungen des gewählten Tages, nach Platz gruppiert. */
  const byResource = useMemo(() => {
    const index = {};
    for (const booking of allBookings) {
      if (booking.date !== selectedDateKey) continue;
      (index[booking.resource_id] ||= []).push(booking);
    }
    return index;
  }, [allBookings, selectedDateKey]);

  /** Wie viele ganztägige Plätze am gewählten Tag belegt sind. */
  const bookedFullDayCount = useMemo(
    () => RESOURCES.filter((r) => !r.timeBased && byResource[r.id]?.length).length,
    [byResource]
  );

  /**
   * Eigene ganztägige Buchung am gewählten Tag.
   * Der Besprechungsraum zählt nicht mit, da er zeitbasiert ist
   * (erkennbar an gesetzter start_time).
   */
  const myFullDayBooking = useMemo(
    () =>
      allBookings.find(
        (b) => b.user_id === userId && b.date === selectedDateKey && b.start_time === null
      ) || null,
    [allBookings, userId, selectedDateKey]
  );

  /**
   * Alle Tage, an denen die Person bereits irgendwo einen Platz hat.
   * Diese Tage sind in einer Serie nicht zusätzlich buchbar
   * (Regel: ein Platz pro Person und Tag).
   */
  const myBookedDates = useMemo(
    () =>
      new Set(
        allBookings.filter((b) => b.user_id === userId && b.start_time === null).map((b) => b.date)
      ),
    [allBookings, userId]
  );

  return {
    horizon,
    selectedDateKey,
    setSelectedDateKey,
    allBookings,
    loading,
    reload,
    byResource,
    bookedFullDayCount,
    myFullDayBooking,
    myBookedDates,
  };
}
