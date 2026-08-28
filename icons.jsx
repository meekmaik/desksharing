// Draufsicht-Symbole im Blueprint-Stil.
// Farbe kommt ausschließlich über die "status"-Prop (nicht per Klasse),
// damit Frei/Belegt/Eigene Buchung sich NICHT nur durch Farbe unterscheiden,
// sondern zusätzlich durch Form/Füllung (Barrierefreiheit).

const COLORS = {
  free: "var(--color-free)",
  booked: "var(--color-booked)",
  mine: "var(--color-mine)",
};

export function DeskIcon({ status = "free", flip = false }) {
  const c = COLORS[status];
  const filled = status !== "free";
  return (
    <svg
      width="22"
      height="25"
      viewBox="0 0 30 34"
      fill="none"
      aria-hidden="true"
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    >
      <rect x="4" y="4" width="22" height="14" rx="1.5" fill="#fff" stroke={c} strokeWidth="2" />
      <circle
        cx="15"
        cy="27"
        r="5.5"
        fill={filled ? c : "none"}
        fillOpacity={filled ? 0.22 : 1}
        stroke={c}
        strokeWidth="1.6"
      />
      {status === "mine" && (
        <path d="M12 27l2 2 4-4.5" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

export function StairsIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <circle cx="17" cy="17" r="16" fill="#fff" stroke="#B7C4CC" strokeWidth="1.5" />
      <path
        d="M9 22h4v-3h4v-3h4v-3h4"
        stroke="var(--color-navy)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="9" r="1.6" fill="var(--color-navy)" />
      <path d="M22 11v4l-2.2 2M22 15l2.4 1.6" stroke="var(--color-navy)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ClockIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

// Rein dekorative Lounge-Ecke (Sofa, Pflanze, Beistelltisch) – nicht klickbar,
// nur zur optischen Annäherung an den Original-Grundriss.
export function LoungeDecor() {
  return (
    <svg width="100%" height="46" viewBox="0 0 200 46" fill="none" aria-hidden="true" preserveAspectRatio="none">
      {/* Sofa */}
      <rect x="8" y="10" width="70" height="26" rx="4" fill="#fff" stroke="#B7C4CC" strokeWidth="1.5" />
      <rect x="8" y="10" width="70" height="9" rx="3" fill="#EEF2F0" stroke="#B7C4CC" strokeWidth="1.2" />
      <line x1="32" y1="10" x2="32" y2="36" stroke="#B7C4CC" strokeWidth="1" />
      <line x1="55" y1="10" x2="55" y2="36" stroke="#B7C4CC" strokeWidth="1" />
      {/* Beistelltisch */}
      <circle cx="96" cy="23" r="10" fill="#fff" stroke="#B7C4CC" strokeWidth="1.5" />
      {/* Pflanze */}
      <circle cx="128" cy="27" r="7" fill="#EEF2F0" stroke="#B7C4CC" strokeWidth="1.4" />
      <path
        d="M128 27c-3-8-2-14 0-17M128 27c3-7 1-13-1-16M128 27c-1-9 2-15 5-17"
        stroke="#7FA98A"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* Kleiner Wagen */}
      <rect x="150" y="12" width="16" height="20" rx="1.5" fill="#fff" stroke="#B7C4CC" strokeWidth="1.4" />
      <line x1="150" y1="19" x2="166" y2="19" stroke="#B7C4CC" strokeWidth="1" />
      <line x1="150" y1="26" x2="166" y2="26" stroke="#B7C4CC" strokeWidth="1" />
      <circle cx="153" cy="34" r="1.6" fill="#B7C4CC" />
      <circle cx="163" cy="34" r="1.6" fill="#B7C4CC" />
    </svg>
  );
}
