// Logik für die Serienbuchung, bewusst als reine Funktion ausgelagert:
// so ist sie unabhängig von der Oberfläche testbar.

// new Date("2026-08-28") wird als UTC gelesen und kann je nach Zeitzone auf
// den Vortag rutschen. Mit "T00:00:00" wird lokal geparst.
export function weekdayOf(dateKey) {
  return new Date(dateKey + "T00:00:00").getDay();
}

/**
 * Ermittelt, welche Tage in einer Serie wählbar sind.
 * Tage, an denen die Person bereits irgendwo einen Platz hat, sind gesperrt
 * (Regel: ein Platz pro Person und Tag). Der aktuell geöffnete Tag bleibt
 * immer wählbar, da man dort ja gerade bucht.
 */
export function computeSeriesOptions(horizon, dateKey, myBookedDates) {
  const isBlocked = (key) => key !== dateKey && !!myBookedDates?.has(key);
  const selectable = horizon.filter((d) => !isBlocked(d.key));
  const target = weekdayOf(dateKey);

  return {
    isBlocked,
    selectable,
    sameWeekdayDates: selectable.filter((d) => weekdayOf(d.key) === target).map((d) => d.key),
    allDates: selectable.map((d) => d.key),
  };
}
