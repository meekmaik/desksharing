import { GROUPS_LEFT, GROUPS_RIGHT, RESOURCES } from "./floorplanData";
import { DeskIcon, StairsIcon } from "./icons";

function resourceStatus(bookings, resourceId, myUserId) {
  const entries = bookings[resourceId] || [];
  if (entries.length === 0) return { status: "free", entries };
  const mine = entries.some((b) => b.user_id === myUserId);
  return { status: mine ? "mine" : "booked", entries };
}

function DeskGroup({ groupId, count, bookings, myUserId, onSelect, flex }) {
  const ids =
    count > 1
      ? Array.from({ length: count }, (_, i) => `${groupId}-${i + 1}`)
      : [groupId];
  return (
    <div className="group-box" style={{ flex }}>
      <div className="desk-grid">
        {ids.map((id) => {
          const { status, entries } = resourceStatus(bookings, id, myUserId);
          const resource = RESOURCES.find((r) => r.id === id);
          return (
            <button
              key={id}
              className="desk-btn"
              onClick={() => onSelect(resource)}
              aria-label={`${resource.label}: ${
                status === "free" ? "frei" : `belegt von ${entries[0]?.name}`
              }`}
              title={status === "free" ? "frei" : entries[0]?.name}
            >
              <DeskIcon status={status} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RoomBox({ group, bookings, myUserId, onSelect }) {
  const resourceId = group.id;
  const { status, entries } = resourceStatus(bookings, resourceId, myUserId);
  const isTimed = group.kind === "room-timed";
  const dotStatus = isTimed && entries.length > 0 ? "booked" : status;

  return (
    <button
      className="room-box"
      style={{ flex: group.flex }}
      onClick={() => onSelect(RESOURCES.find((r) => r.id === resourceId))}
    >
      <span className={`status-dot status-dot-${dotStatus}`} />
      <span className="room-label">{group.label}</span>
    </button>
  );
}

export default function FloorPlan({ bookings, myUserId, onSelect }) {
  return (
    <div className="building">
      <div className="floorplan">
        <div className="col col-left">
          {GROUPS_LEFT.map((g) => (
            <DeskGroup
              key={g.id}
              groupId={g.id}
              count={g.desks}
              flex={g.flex}
              bookings={bookings}
              myUserId={myUserId}
              onSelect={onSelect}
            />
          ))}
        </div>

        <div className="hallway" />

        <div className="col col-right">
          <div className="stairs-row">
            <StairsIcon />
          </div>
          {GROUPS_RIGHT.map((g) =>
            g.kind === "desk-group" ? (
              <DeskGroup
                key={g.id}
                groupId={g.id}
                count={g.desks}
                flex={g.flex}
                bookings={bookings}
                myUserId={myUserId}
                onSelect={onSelect}
              />
            ) : (
              <RoomBox
                key={g.id}
                group={g}
                bookings={bookings}
                myUserId={myUserId}
                onSelect={onSelect}
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
