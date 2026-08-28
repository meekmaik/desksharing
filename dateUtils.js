const WEEKDAY_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
  "Jul", "Aug", "Sep", "Okt", "Nov", "Dez",
];

export function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWeekend(d) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

// 14 Tage im Voraus, inklusive heute. Wochenenden werden übersprungen
// (im Büro wird an Wochenenden ohnehin nicht gebucht), es sei denn,
// dadurch blieben weniger als 5 Tage übrig.
export function getBookingHorizon(days = 14) {
  const out = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let guard = 0;
  while (out.length < days && guard < days * 3) {
    const d = new Date(cursor);
    if (!isWeekend(d)) {
      out.push({
        key: toDateKey(d),
        date: d,
        weekday: WEEKDAY_SHORT[d.getDay()],
        label: `${d.getDate()}. ${MONTH_SHORT[d.getMonth()]}`,
        isToday: out.length === 0 && toDateKey(d) === toDateKey(new Date()),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }
  return out;
}

export function formatDateLong(dateKey) {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
