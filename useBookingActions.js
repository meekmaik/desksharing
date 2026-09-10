import { useCallback, useState } from "react";
import { supabase } from "./supabaseClient";

/**
 * crypto.randomUUID gibt es erst ab neueren Browsern (z.B. iOS 15.4).
 * Für ältere Geräte wird die UUID hier selbst zusammengesetzt.
 */
function makeUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variante
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Bündelt alle schreibenden Vorgänge (buchen, stornieren) samt
 * gemeinsamem Lade- und Fehlerzustand.
 *
 * Vorher lag jede dieser Funktionen einzeln in App.jsx, jeweils mit
 * eigener, fast identischer Fehlerbehandlung.
 *
 * @param {object} deps
 * @param {string|null} deps.userId
 * @param {() => Promise<void>} deps.reload Buchungen neu laden.
 * @param {(msg: string) => void} deps.onToast
 * @param {() => void} deps.onClose Dialog schließen.
 */
export function useBookingActions({ userId, reload, onToast, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  /** Ganztägige Buchung, einzeln oder als Serie über mehrere Tage. */
  const bookFullDay = async (resource, dates, name) => {
    setBusy(true);
    setError(null);

    const seriesId = dates.length > 1 ? makeUuid() : null;
    const toRow = (date) => ({
      resource_id: resource.id,
      date,
      name,
      user_id: userId,
      series_id: seriesId,
    });

    // Zuerst ein einziger Aufruf für alle Tage (schnell). Schlägt er fehl,
    // ist mindestens ein Tag belegt -- dann einzeln nachfassen, um die
    // übrigen Tage trotzdem zu buchen und zu wissen, welche fehlschlagen.
    let failed = [];
    const { error: bulkError } = await supabase.from("bookings").insert(dates.map((d) => toRow(d)));
    if (bulkError) {
      for (const date of dates) {
        const { error: singleError } = await supabase.from("bookings").insert(toRow(date));
        if (singleError) failed.push(date);
      }
    }

    setBusy(false);
    await reload();

    const ok = dates.length - failed.length;
    if (failed.length === 0) {
      onClose();
      onToast(dates.length > 1 ? `${dates.length} Tage gebucht.` : "Gebucht.");
    } else if (ok === 0) {
      setError("Diese(r) Termin(e) ist/sind bereits belegt.");
    } else {
      onClose();
      onToast(`${ok} von ${dates.length} Tagen gebucht (Rest bereits belegt).`);
    }
  };

  /**
   * Ganztägige Buchung stornieren.
   * @param {"single"|"series"} mode
   * @param {boolean} keepOpen Dialog offen lassen (für "Meine Buchungen",
   *   wo man mehrere Einträge nacheinander stornieren möchte).
   */
  const cancelFullDay = async (booking, mode, keepOpen = false) => {
    setBusy(true);
    setError(null);

    // Absicherung: ohne series_id würde eine Serien-Stornierung ins Leere
    // laufen und im schlimmsten Fall nichts oder zu viel löschen.
    const asSeries = mode === "series" && Boolean(booking.series_id);
    const query = supabase.from("bookings").delete();
    const { error: err } = asSeries
      ? await query.eq("series_id", booking.series_id)
      : await query.eq("id", booking.id);

    setBusy(false);
    if (err) {
      setError("Stornieren fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }

    await reload();
    if (!keepOpen) onClose();
    onToast(asSeries ? "Serie storniert." : "Storniert.");
  };

  /** Besprechungsraum für einen Zeitraum buchen. */
  const bookTimed = async (resource, dateKey, start, end, name) => {
    setBusy(true);
    setError(null);

    const { error: err } = await supabase.from("bookings").insert({
      resource_id: resource.id,
      date: dateKey,
      start_time: start,
      end_time: end,
      name,
      user_id: userId,
    });

    setBusy(false);
    if (err) {
      // Bei Überschneidungen liefert die Datenbank bereits einen
      // verständlichen deutschen Text -- den zeigen wir unverändert an.
      setError(err.message?.includes("überschneidet") ? err.message : "Buchung fehlgeschlagen.");
      return;
    }

    await reload();
    onToast("Termin gebucht.");
  };

  /** Einzelnen Besprechungsraum-Termin stornieren. */
  const cancelTimed = async (booking) => {
    setBusy(true);
    setError(null);

    const { error: err } = await supabase.from("bookings").delete().eq("id", booking.id);

    setBusy(false);
    if (err) {
      setError("Stornieren fehlgeschlagen.");
      return;
    }

    await reload();
    onToast("Termin storniert.");
  };

  return { busy, error, clearError, bookFullDay, cancelFullDay, bookTimed, cancelTimed };
}
