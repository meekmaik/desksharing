import { GROUPS_LEFT, GROUPS_RIGHT, RESOURCES } from "./floorplanData";

/*
  Der komplette Grundriss ist EINE SVG-Zeichnung mit fester viewBox.
  Dadurch bleiben alle Proportionen auf jedem Gerät exakt gleich – die
  Zeichnung wird nur als Ganzes skaliert, nie umgebrochen oder umsortiert.

  Koordinatensystem: 400 breit x 900 hoch (schmal & hoch wie im Original).
*/
const VB_W = 400;
const VB_H = 780;

// Spalten
const LEFT_X = 20;
const LEFT_W = 152;
const HALL_X = LEFT_X + LEFT_W;      // 172
const HALL_W = 40;
const RIGHT_X = HALL_X + HALL_W;     // 212
const RIGHT_W = 168;

// 4 Tischgruppen links, gleichmäßig verteilt
const GROUP_Y = [56, 226, 396, 566];

const DESK_W = 54;
const DESK_H = 32;
const CHAIR_R = 8;

function statusOf(bookings, id, myUserId) {
  const entries = bookings[id] || [];
  if (entries.length === 0) return { status: "free", entries };
  return {
    status: entries.some((b) => b.user_id === myUserId) ? "mine" : "booked",
    entries,
  };
}

// Ein Schreibtisch mit Stuhl. chairSide = "above" | "below".
// Der Stuhl sitzt immer an der LANGEN Tischseite (oben oder unten).
function Desk({ id, x, y, chairSide, bookings, myUserId, onSelect }) {
  const { status, entries } = statusOf(bookings, id, myUserId);
  const resource = RESOURCES.find((r) => r.id === id);
  if (!resource) return null;

  const chairX = x + DESK_W / 2;
  const chairY =
    chairSide === "above" ? y - CHAIR_R - 4 : y + DESK_H + CHAIR_R + 4;
  const filled = status !== "free";
  const occupied = status === "free" ? "frei" : `belegt von ${entries[0]?.name ?? "jemandem"}`;

  return (
    <g
      className={`fp-desk fp-${status}`}
      onClick={() => onSelect(resource)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(resource)}
      aria-label={`${resource.label}: ${occupied}`}
    >
      <title>{`${resource.label} – ${occupied}`}</title>
      <rect
        x={x}
        y={y}
        width={DESK_W}
        height={DESK_H}
        rx="2"
        className="fp-desk-top"
        fillOpacity={filled ? 0.18 : 1}
      />
      <circle cx={chairX} cy={chairY} r={CHAIR_R} className="fp-chair" />
      {status === "mine" && (
        <path
          d={`M${chairX - 4} ${chairY} l3 3 l5.5 -6`}
          className="fp-check"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}

// Tischgruppe von unten nach oben: Kreise, Tisch, Tisch, Kreise.
// Die beiden Tischreihen stoßen zusammen, die Personen sitzen außen an
// den langen Seiten und schauen sich gegenüber.
function DeskCluster({ groupId, y, bookings, myUserId, onSelect }) {
  const colLeftX = LEFT_X + (LEFT_W - DESK_W * 2) / 2;
  const colRightX = colLeftX + DESK_W;
  const topRowY = y + CHAIR_R * 2 + 4;      // Platz für die obere Stuhlreihe
  const bottomRowY = topRowY + DESK_H;      // Tische stoßen zusammen

  const slots = [
    { n: 1, x: colLeftX, y: topRowY, side: "above" },
    { n: 2, x: colRightX, y: topRowY, side: "above" },
    { n: 3, x: colLeftX, y: bottomRowY, side: "below" },
    { n: 4, x: colRightX, y: bottomRowY, side: "below" },
  ];

  return (
    <g>
      {slots.map((s) => (
        <Desk
          key={s.n}
          id={`${groupId}-${s.n}`}
          x={s.x}
          y={s.y}
          chairSide={s.side}
          bookings={bookings}
          myUserId={myUserId}
          onSelect={onSelect}
        />
      ))}
    </g>
  );
}

// Ganztägig buchbarer Raum (Einzelbüro) mit Schreibtisch + Stuhl.
function OfficeRoom({ group, x, y, w, h, bookings, myUserId, onSelect }) {
  const { status, entries } = statusOf(bookings, group.id, myUserId);
  const resource = RESOURCES.find((r) => r.id === group.id);
  const filled = status !== "free";
  const deskW = Math.min(74, w - 46);
  const deskX = x + (w - deskW) / 2;
  const BLOCK = 90; // Stuhl + Tisch + Namenszeile
  const chairY = y + 20 + Math.max(8, (h - 20 - BLOCK) / 2);
  const deskY = chairY + CHAIR_R + 12;

  return (
    <g
      className={`fp-room fp-${status}`}
      onClick={() => resource && onSelect(resource)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && resource && onSelect(resource)}
      aria-label={`${group.label}: ${status === "free" ? "frei" : `belegt von ${entries[0]?.name}`}`}
    >
      <title>{`${group.label} – ${status === "free" ? "frei" : entries[0]?.name}`}</title>
      <rect x={x} y={y} width={w} height={h} className="fp-room-bg" />
      <circle cx={x + w / 2} cy={chairY} r="9" className="fp-chair" />
      {status === "mine" && (
        <path
          d={`M${x + w / 2 - 4.5} ${chairY} l3.4 3.4 l6 -6.6`}
          className="fp-check"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      <rect
        x={deskX}
        y={deskY}
        width={deskW}
        height={26}
        rx="2"
        className="fp-desk-top"
        fillOpacity={filled ? 0.18 : 1}
      />
      <text x={x + w / 2} y={y + 16} className="fp-label">
        {group.label}
      </text>
      <text x={x + w / 2} y={deskY + 44} className={`fp-sub ${filled ? "fp-sub-taken" : ""}`}>
        {status === "free" ? "frei" : entries[0]?.name}
      </text>
    </g>
  );
}

// Besprechungsraum: Konferenztisch mit Stühlen, Lounge-Ecke, Terminliste.
function MeetingRoom({ group, x, y, w, h, bookings, myUserId, onSelect }) {
  const { status, entries } = statusOf(bookings, group.id, myUserId);
  const resource = RESOURCES.find((r) => r.id === group.id);
  const booked = entries.length > 0;
  const cls = booked ? (status === "mine" ? "mine" : "booked") : "free";

  const list = [...entries]
    .filter((b) => b.start_time && b.end_time)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 3);

  const tableY = y + 62;
  const tableX = x + 24;
  const tableW = w - 48;

  return (
    <g
      className={`fp-room fp-${cls}`}
      onClick={() => resource && onSelect(resource)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && resource && onSelect(resource)}
      aria-label={`${group.label}: ${entries.length} Termine`}
    >
      <title>{`${group.label} – ${entries.length} Termine`}</title>
      <rect x={x} y={y} width={w} height={h} className="fp-room-bg" />
      <text x={x + w / 2} y={y + 16} className="fp-label">
        {group.label}
      </text>

      {/* Lounge-Ecke: Sofa + Beistelltisch + Pflanze (Dekoration) */}
      <g className="fp-decor">
        <rect x={x + 14} y={y + 26} width={50} height={18} rx="3" />
        <rect x={x + 18} y={y + 31} width={20} height={12} rx="2" className="fp-decor-light" />
        <rect x={x + 40} y={y + 31} width={20} height={12} rx="2" className="fp-decor-light" />
        <circle cx={x + 78} cy={y + 35} r="8" className="fp-decor-light" />
        <circle cx={x + w - 26} cy={y + 36} r="6.5" />
        <path
          d={`M${x + w - 26} ${y + 36} c-2.5 -6 -1.5 -9 0 -11 M${x + w - 26} ${y + 36} c2.5 -5 1.5 -8 0 -10`}
          className="fp-plant"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      {/* Konferenztisch mit Stühlen */}
      <g>
        {[0, 1, 2].map((i) => (
          <rect
            key={`t${i}`}
            x={tableX + 8 + i * ((tableW - 30) / 3)}
            y={tableY + 6}
            width="18"
            height="7"
            rx="2"
            className="fp-seat"
          />
        ))}
        <rect
          x={tableX}
          y={tableY + 17}
          width={tableW}
          height="26"
          rx="13"
          className="fp-desk-top"
          fillOpacity={booked ? 0.18 : 1}
        />
        {[0, 1, 2].map((i) => (
          <rect
            key={`b${i}`}
            x={tableX + 8 + i * ((tableW - 30) / 3)}
            y={tableY + 47}
            width="18"
            height="7"
            rx="2"
            className="fp-seat"
          />
        ))}
      </g>

      {/* Termine des Tages – direkt unter dem Konferenztisch */}
      {list.length === 0 ? (
        <text x={x + w / 2} y={tableY + 78} className="fp-sub">
          frei – ganztägig
        </text>
      ) : (
        list.map((b, i) => (
          <text key={b.id} x={x + w / 2} y={tableY + 74 + i * 13} className="fp-slot">
            {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)} {b.name}
          </text>
        ))
      )}
    </g>
  );
}

// Fläche mit 3 Arbeitsplätzen (rechts)
function TrioArea({ group, x, y, w, h, bookings, myUserId, onSelect }) {
  const ids = [1, 2, 3].map((n) => `${group.id}-${n}`);
  const deskW = 62;
  const deskH = 24;
  const usable = h - 42;
  const step = usable / 3;
  const startY = y + 34 + (step - deskH - CHAIR_R) / 2;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="fp-room-bg" />
      <text x={x + w / 2} y={y + 16} className="fp-label">
        {group.label}
      </text>
      {ids.map((id, i) => {
        const { status, entries } = statusOf(bookings, id, myUserId);
        const resource = RESOURCES.find((r) => r.id === id);
        if (!resource) return null;
        const dy = startY + i * step;
        const dx = x + (w - deskW) / 2;
        const filled = status !== "free";
        const occupied =
          status === "free" ? "frei" : `belegt von ${entries[0]?.name ?? "jemandem"}`;
        return (
          <g
            key={id}
            className={`fp-desk fp-${status}`}
            onClick={() => onSelect(resource)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(resource)}
            aria-label={`${resource.label}: ${occupied}`}
          >
            <title>{`${resource.label} – ${occupied}`}</title>
            <circle
              cx={dx + deskW / 2}
              cy={dy - CHAIR_R - 4}
              r={CHAIR_R}
              className="fp-chair"
            />
            {status === "mine" && (
              <path
                d={`M${dx + deskW / 2 - 4} ${dy - CHAIR_R - 4} l3 3 l5.5 -6`}
                className="fp-check"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect
              x={dx}
              y={dy}
              width={deskW}
              height={deskH}
              rx="2"
              className="fp-desk-top"
              fillOpacity={filled ? 0.18 : 1}
            />
          </g>
        );
      })}
    </g>
  );
}

export default function FloorPlan({ bookings, myUserId, onSelect }) {
  const meet = GROUPS_RIGHT.find((g) => g.id === "MEET");
  const offS = GROUPS_RIGHT.find((g) => g.id === "OFF_S");
  const trio = GROUPS_RIGHT.find((g) => g.id === "TRIO");
  const offL = GROUPS_RIGHT.find((g) => g.id === "OFF_L");

  // Raumhöhen rechts (Summe passt in 900 abzüglich Treppenhaus oben)
  const R = {
    stairs: { y: 16, h: 62 },
    meet: { y: 82, h: 178 },
    offS: { y: 264, h: 122 },
    trio: { y: 390, h: 196 },
    offL: { y: 590, h: 172 },
  };

  return (
    <div className="building">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        className="floorplan-svg"
        role="group"
        aria-label="Grundriss mit buchbaren Arbeitsplätzen"
      >
        {/* Außenwand */}
        <rect x="6" y="6" width={VB_W - 12} height={VB_H - 12} className="fp-outer-wall" />

        {/* Flur */}
        <rect x={HALL_X} y="14" width={HALL_W} height={VB_H - 28} className="fp-hallway" />

        {/* Tischgruppen links */}
        {GROUPS_LEFT.map((g, i) => (
          <DeskCluster
            key={g.id}
            groupId={g.id}
            y={GROUP_Y[i]}
            bookings={bookings}
            myUserId={myUserId}
            onSelect={onSelect}
          />
        ))}

        {/* Treppenhaus oben rechts */}
        <g className="fp-stairs">
          <rect x={RIGHT_X} y={R.stairs.y} width={RIGHT_W} height={R.stairs.h} className="fp-room-bg" />
          <path
            d={`M${RIGHT_X + 30} ${R.stairs.y + 32} h13 v-8 h13 v-8 h13 v-8 h13`}
            fill="none"
          />
          <circle cx={RIGHT_X + 100} cy={R.stairs.y + 12} r="3.5" className="fp-stairs-dot" />
          <text x={RIGHT_X + RIGHT_W / 2} y={R.stairs.y + 55} className="fp-sub">
            Treppenhaus
          </text>
        </g>

        {/* Räume rechts */}
        {meet && (
          <MeetingRoom
            group={meet}
            x={RIGHT_X}
            y={R.meet.y}
            w={RIGHT_W}
            h={R.meet.h}
            bookings={bookings}
            myUserId={myUserId}
            onSelect={onSelect}
          />
        )}
        {offS && (
          <OfficeRoom
            group={offS}
            x={RIGHT_X}
            y={R.offS.y}
            w={RIGHT_W}
            h={R.offS.h}
            bookings={bookings}
            myUserId={myUserId}
            onSelect={onSelect}
          />
        )}
        {trio && (
          <TrioArea
            group={trio}
            x={RIGHT_X}
            y={R.trio.y}
            w={RIGHT_W}
            h={R.trio.h}
            bookings={bookings}
            myUserId={myUserId}
            onSelect={onSelect}
          />
        )}
        {offL && (
          <OfficeRoom
            group={offL}
            x={RIGHT_X}
            y={R.offL.y}
            w={RIGHT_W}
            h={R.offL.h}
            bookings={bookings}
            myUserId={myUserId}
            onSelect={onSelect}
          />
        )}

        {/* Trennwände rechts (dick, wie im Original) */}
        {[R.meet.y, R.offS.y, R.trio.y, R.offL.y, R.offL.y + R.offL.h].map((wy, i) => (
          <line key={i} x1={RIGHT_X} y1={wy} x2={VB_W - 8} y2={wy} className="fp-wall" />
        ))}
        {/* Trennwand zwischen Flur und rechter Spalte */}
        <line x1={RIGHT_X} y1="14" x2={RIGHT_X} y2={VB_H - 14} className="fp-wall-thin" />
        <line x1={HALL_X} y1="14" x2={HALL_X} y2={VB_H - 14} className="fp-wall-thin" />
      </svg>
    </div>
  );
}
