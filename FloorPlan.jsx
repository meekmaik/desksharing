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
// chairSide = "above" (Person schaut nach unten) | "below" (schaut nach oben)
function OfficeRoom({ group, x, y, w, h, chairSide = "above", bookings, myUserId, onSelect }) {
  const { status, entries } = statusOf(bookings, group.id, myUserId);
  const resource = RESOURCES.find((r) => r.id === group.id);
  const filled = status !== "free";
  const deskW = Math.min(74, w - 46);
  const deskH = 26;
  const deskX = x + (w - deskW) / 2;
  const cx = x + w / 2;

  const BLOCK = 90; // Stuhl + Tisch + Namenszeile
  const top = y + 20 + Math.max(8, (h - 20 - BLOCK) / 2);
  const deskY = chairSide === "above" ? top + 21 : top;
  const chairY = chairSide === "above" ? top : top + deskH + 21;
  const textY = Math.max(deskY + deskH, chairY + 9) + 18;

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
      <circle cx={cx} cy={chairY} r="9" className="fp-chair" />
      {status === "mine" && (
        <path
          d={`M${cx - 4.5} ${chairY} l3.4 3.4 l6 -6.6`}
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
        height={deskH}
        rx="2"
        className="fp-desk-top"
        fillOpacity={filled ? 0.18 : 1}
      />
      <text x={cx} y={y + 16} className="fp-label">
        {group.label}
      </text>
      <text x={cx} y={textY} className={`fp-sub ${filled ? "fp-sub-taken" : ""}`}>
        {status === "free" ? "frei" : entries[0]?.name}
      </text>
    </g>
  );
}

// Besprechungsraum: Sitzgruppe aus Couch und Couchtisch.
// Klickfläche zum Buchen = Couch + Couchtisch + der Platz dazwischen.
function MeetingRoom({ group, x, y, w, h, bookings, myUserId, onSelect }) {
  const { status, entries } = statusOf(bookings, group.id, myUserId);
  const resource = RESOURCES.find((r) => r.id === group.id);
  const booked = entries.length > 0;
  const cls = booked ? (status === "mine" ? "mine" : "booked") : "free";

  const list = [...entries]
    .filter((b) => b.start_time && b.end_time)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .slice(0, 3);

  const cx = x + w / 2;
  const couchW = 96;
  const couchH = 26;
  const couchX = cx - couchW / 2;
  const couchY = y + 30;

  const tableW = 60;
  const tableH = 24;
  const tableX = cx - tableW / 2;
  const tableY = couchY + couchH + 20; // Platz zwischen Couch und Couchtisch

  // Ein zusammenhängender Klickbereich über Couch, Zwischenraum und Tisch
  const hitX = couchX - 8;
  const hitY = couchY - 8;
  const hitW = couchW + 16;
  const hitH = tableY + tableH + 8 - hitY;

  const label = booked
    ? `${entries.length} ${entries.length === 1 ? "Termin" : "Termine"}`
    : "frei";

  return (
    <g className={`fp-room fp-${cls}`}>
      <rect x={x} y={y} width={w} height={h} className="fp-room-bg" />
      <text x={cx} y={y + 16} className="fp-label">
        {group.label}
      </text>

      {/* Klickbare Sitzgruppe */}
      <g
        className="fp-sitting"
        onClick={() => resource && onSelect(resource)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && resource && onSelect(resource)}
        aria-label={`${group.label}: ${label}`}
      >
        <title>{`${group.label} – ${label}`}</title>
        <rect
          x={hitX}
          y={hitY}
          width={hitW}
          height={hitH}
          rx="4"
          fill="transparent"
          className="fp-hit"
        />

        {/* Couch: Rückenlehne, zwei Sitzflächen, Armlehnen */}
        <rect x={couchX} y={couchY} width={couchW} height={couchH} rx="4" className="fp-seat" />
        <rect
          x={couchX + 7}
          y={couchY + 8}
          width={(couchW - 20) / 2}
          height={couchH - 12}
          rx="2"
          fill="#fff"
          className="fp-cushion"
        />
        <rect
          x={couchX + couchW / 2 + 3}
          y={couchY + 8}
          width={(couchW - 20) / 2}
          height={couchH - 12}
          rx="2"
          fill="#fff"
          className="fp-cushion"
        />

        {/* Couchtisch */}
        <rect
          x={tableX}
          y={tableY}
          width={tableW}
          height={tableH}
          rx="4"
          className="fp-desk-top"
          fillOpacity={booked ? 0.18 : 1}
        />
        {status === "mine" && (
          <path
            d={`M${cx - 6} ${tableY + tableH / 2} l4 4 l8 -8`}
            className="fp-check"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>

      {/* Termine des Tages */}
      {list.length === 0 ? (
        <text x={cx} y={tableY + tableH + 24} className="fp-sub">
          frei – ganztägig
        </text>
      ) : (
        list.map((b, i) => (
          <text key={b.id} x={cx} y={tableY + tableH + 22 + i * 13} className="fp-slot">
            {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)} {b.name}
          </text>
        ))
      )}
    </g>
  );
}

// Fläche mit 3 Arbeitsplätzen, als U angeordnet:
// linker Schenkel, unterer Steg, rechter Schenkel.
// Die Stühle sitzen jeweils AUSSEN am U.
function TrioArea({ group, x, y, w, h, bookings, myUserId, onSelect }) {
  const cx = x + w / 2;
  const T = 22;          // Tischtiefe
  const armH = 62;       // Länge der beiden Schenkel
  const uW = 96;         // Außenbreite des U
  const uX = cx - uW / 2;
  const topY = y + 34;   // Oberkante der Schenkel

  const baseY = topY + armH;               // Steg unten
  const rightX = uX + uW - T;

  // id, Tischgeometrie, Stuhlposition (außen)
  const parts = [
    {
      id: `${group.id}-1`,
      rect: { x: uX, y: topY, w: T, h: armH },
      chair: { cx: uX - 14, cy: topY + armH / 2 },
    },
    {
      id: `${group.id}-3`,
      rect: { x: rightX, y: topY, w: T, h: armH },
      chair: { cx: rightX + T + 14, cy: topY + armH / 2 },
    },
    {
      id: `${group.id}-2`,
      rect: { x: uX, y: baseY, w: uW, h: T },
      chair: { cx: cx, cy: baseY + T + 14 },
    },
  ];

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} className="fp-room-bg" />
      <text x={cx} y={y + 16} className="fp-label">
        {group.label}
      </text>
      {parts.map((p) => {
        const { status, entries } = statusOf(bookings, p.id, myUserId);
        const resource = RESOURCES.find((r) => r.id === p.id);
        if (!resource) return null;
        const filled = status !== "free";
        const occupied =
          status === "free" ? "frei" : `belegt von ${entries[0]?.name ?? "jemandem"}`;
        return (
          <g
            key={p.id}
            className={`fp-desk fp-${status}`}
            onClick={() => onSelect(resource)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(resource)}
            aria-label={`${resource.label}: ${occupied}`}
          >
            <title>{`${resource.label} – ${occupied}`}</title>
            <circle cx={p.chair.cx} cy={p.chair.cy} r={CHAIR_R} className="fp-chair" />
            {status === "mine" && (
              <path
                d={`M${p.chair.cx - 4} ${p.chair.cy} l3 3 l5.5 -6`}
                className="fp-check"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            <rect
              x={p.rect.x}
              y={p.rect.y}
              width={p.rect.w}
              height={p.rect.h}
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
            chairSide="below"
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
