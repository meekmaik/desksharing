// Zentrale Einstellungen der App.
// Diese Werte waren früher an mehreren Stellen im Code verstreut ("14"
// stand z.B. in App.jsx UND im Hinweistext von MyBookingsPanel). Wenn du
// etwas ändern willst, ist HIER die einzige Stelle dafür.

/** Wie viele Werktage im Voraus gebucht werden kann. */
export const BOOKING_DAYS = 14;

/** Wie lange eine kurze Rückmeldung ("Gebucht.") unten eingeblendet bleibt, in ms. */
export const TOAST_MS = 3000;

/** Wie oft geprüft wird, ob ein neuer Tag angebrochen ist, in ms. */
export const DAY_ROLLOVER_CHECK_MS = 60_000;

/** Standarddauer einer neuen Besprechungsraum-Buchung, in Minuten. */
export const DEFAULT_MEETING_MINUTES = 60;

/** Wie viele Termine der Grundriss beim Besprechungsraum direkt anzeigt. */
export const MEETING_SLOTS_VISIBLE = 3;
