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
    <svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true">
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
