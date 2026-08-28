// Draufsicht-Symbole im Blueprint-Stil.
// Farbe kommt ausschließlich über die "status"-Prop (nicht per Klasse),
// damit Frei/Belegt/Eigene Buchung sich NICHT nur durch Farbe unterscheiden,
// sondern zusätzlich durch Form/Füllung (Barrierefreiheit).

const COLORS = {
  free: "var(--color-free)",
  booked: "var(--color-booked)",
  mine: "var(--color-mine)",
};

export function DeskIcon({ status = "free" }) {
  const c = COLORS[status];
  const filled = status !== "free";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill={filled ? c : "#fff"} stroke={c} strokeWidth="2" />
      {status === "mine" && (
        <path d="M6.5 10l2.3 2.3L14 7.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

// Rein dekorative Lounge-Ecke – bewusst reduziert (Sofa-Silhouette + Pflanze),
// nicht klickbar, nur zur optischen Auflockerung.
export function LoungeDecor() {
  return (
    <svg width="100%" height="40" viewBox="0 0 200 40" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <rect x="6" y="8" width="90" height="24" rx="10" fill="var(--color-turquoise-light)" />
      <rect x="14" y="14" width="74" height="12" rx="6" fill="#fff" opacity="0.7" />
      <circle cx="118" cy="20" r="9" fill="var(--color-turquoise-light)" />
      <path
        d="M118 20c-2-6-1-10 0-12M118 20c2-5 1-9-1-11"
        stroke="#7FA98A"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
