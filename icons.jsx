// Draufsicht-Symbole im Grundriss-Stil.
// Der Status wird NICHT nur über Farbe unterschieden, sondern zusätzlich
// über Füllung und ein Häkchen (Barrierefreiheit).

const COLORS = {
  free: "var(--color-free)",
  booked: "var(--color-booked)",
  mine: "var(--color-mine)",
};

// Rechteckiger Tisch mit einem Kreis (Stuhl/Person).
// chairPosition: "top" | "bottom" – damit sich gegenüberliegende Reihen
// tatsächlich anschauen, statt alle gleich ausgerichtet zu sein.
export function DeskIcon({ status = "free", chairPosition = "bottom" }) {
  const c = COLORS[status];
  const filled = status !== "free";
  const chairTop = chairPosition === "top";

  return (
    <svg width="40" height="30" viewBox="0 0 40 30" fill="none" aria-hidden="true">
      {/* Tischplatte */}
      <rect
        x="2"
        y={chairTop ? 13 : 2}
        width="36"
        height="15"
        rx="1.5"
        fill={filled ? c : "#fff"}
        fillOpacity={filled ? 0.16 : 1}
        stroke={c}
        strokeWidth="1.8"
      />
      {/* Stuhl / Person */}
      <circle
        cx="20"
        cy={chairTop ? 7 : 23}
        r="5"
        fill={filled ? c : "#fff"}
        stroke={c}
        strokeWidth="1.8"
      />
      {status === "mine" && (
        <path
          d={chairTop ? "M17.4 7l1.8 1.8L22.6 5.2" : "M17.4 23l1.8 1.8L22.6 21.2"}
          stroke="#fff"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function StairsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 34 34" fill="none" aria-hidden="true">
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

// Besprechungstisch von oben: ovaler Tisch mit Stühlen ringsum.
export function MeetingTableIcon({ status = "free" }) {
  const c = COLORS[status];
  const filled = status !== "free";
  return (
    <svg width="86" height="46" viewBox="0 0 86 46" fill="none" aria-hidden="true">
      {/* Stühle oben */}
      <rect x="20" y="3" width="12" height="7" rx="2" fill={filled ? c : "#E8EEF0"} />
      <rect x="38" y="3" width="12" height="7" rx="2" fill={filled ? c : "#E8EEF0"} />
      <rect x="56" y="3" width="12" height="7" rx="2" fill={filled ? c : "#E8EEF0"} />
      {/* Stühle unten */}
      <rect x="20" y="36" width="12" height="7" rx="2" fill={filled ? c : "#E8EEF0"} />
      <rect x="38" y="36" width="12" height="7" rx="2" fill={filled ? c : "#E8EEF0"} />
      <rect x="56" y="36" width="12" height="7" rx="2" fill={filled ? c : "#E8EEF0"} />
      {/* Tisch */}
      <rect
        x="14"
        y="12"
        width="60"
        height="22"
        rx="11"
        fill={filled ? c : "#fff"}
        fillOpacity={filled ? 0.16 : 1}
        stroke={c}
        strokeWidth="1.8"
      />
    </svg>
  );
}

// Einzelbüro von oben: Schreibtisch mit Stuhl.
export function OfficeIcon({ status = "free", size = "small" }) {
  const c = COLORS[status];
  const filled = status !== "free";
  const w = size === "large" ? 56 : 44;
  return (
    <svg width={w} height="34" viewBox={`0 0 ${w} 34`} fill="none" aria-hidden="true">
      <rect
        x="2"
        y="4"
        width={w - 4}
        height="14"
        rx="1.5"
        fill={filled ? c : "#fff"}
        fillOpacity={filled ? 0.16 : 1}
        stroke={c}
        strokeWidth="1.8"
      />
      <circle cx={w / 2} cy="26" r="5" fill={filled ? c : "#fff"} stroke={c} strokeWidth="1.8" />
    </svg>
  );
}

// Rein dekorative Lounge-Ecke: Sofa mit Beistelltisch und Pflanze.
export function LoungeDecor() {
  return (
    <svg width="118" height="42" viewBox="0 0 118 42" fill="none" aria-hidden="true">
      {/* Sofa: Rückenlehne + Sitzfläche + Armlehnen */}
      <rect x="4" y="8" width="58" height="26" rx="4" fill="#EEF3F4" stroke="#C3D0D6" strokeWidth="1.4" />
      <rect x="9" y="15" width="21" height="15" rx="3" fill="#fff" stroke="#C3D0D6" strokeWidth="1.2" />
      <rect x="34" y="15" width="21" height="15" rx="3" fill="#fff" stroke="#C3D0D6" strokeWidth="1.2" />
      {/* Beistelltisch */}
      <circle cx="76" cy="21" r="9" fill="#fff" stroke="#C3D0D6" strokeWidth="1.4" />
      {/* Pflanze */}
      <circle cx="101" cy="26" r="7" fill="#EEF3F4" stroke="#C3D0D6" strokeWidth="1.3" />
      <path
        d="M101 26c-3-6-2-11 0-13M101 26c3-5 2-10 0-12M101 26c-2-7 1-11 4-13"
        stroke="#6FA382"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
