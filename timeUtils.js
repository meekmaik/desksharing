// Zeit-Hilfsfunktionen für den Besprechungsraum, bewusst als reine
// Funktionen ausgelagert, damit sie unabhängig testbar sind.

const DAY_END = 24 * 60 - 1; // 23:59

// "09:30" -> 570. Ungültige Eingaben ergeben null.
export function minutesOf(t) {
  if (!t || typeof t !== "string") return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

// 570 -> "09:30"
export function toTime(mins) {
  const clamped = Math.max(0, Math.min(mins, DAY_END));
  const h = String(Math.floor(clamped / 60)).padStart(2, "0");
  const m = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// 90 -> "1 Std. 30 Min."
export function formatDuration(mins) {
  if (mins == null || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} Std. ${m} Min.`;
  if (h) return `${h} Std.`;
  return `${m} Min.`;
}

/**
 * Neue Endzeit, wenn die Startzeit verschoben wird.
 * Die bisher eingestellte Dauer bleibt erhalten (Standard: 60 Minuten),
 * damit die Endzeit nie vor der Startzeit landet.
 */
export function endAfterStartChange(oldStart, oldEnd, newStart, defaultMinutes = 60) {
  const prev = minutesOf(oldStart);
  const prevEnd = minutesOf(oldEnd);
  const next = minutesOf(newStart);
  if (next === null) return oldEnd;

  const duration =
    prev !== null && prevEnd !== null && prevEnd > prev ? prevEnd - prev : defaultMinutes;

  // Am Tagesende bleibt mindestens eine Viertelstunde erhalten.
  if (next >= DAY_END - 15) return toTime(DAY_END);
  return toTime(Math.min(next + duration, DAY_END));
}
