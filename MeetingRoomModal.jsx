import { useState } from "react";
import { formatDateLong } from "./dateUtils";

export default function MeetingRoomModal({
  resource,
  dateKey,
  entries,
  myUserId,
  myName,
  busy,
  error,
  onClose,
  onBook,
  onCancel,
}) {
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");

  // Defensiv: Einträge ohne Uhrzeit würden beim Sortieren/Anzeigen abstürzen.
  const sorted = [...entries]
    .filter((b) => b.start_time && b.end_time)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));
  const valid = start && end && end > start;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{resource.label}</div>
        <div className="modal-sub">{formatDateLong(dateKey)}</div>

        {error && <div className="modal-error">{error}</div>}

        <div className="agenda">
          {sorted.length === 0 && <p className="modal-hint">Noch keine Termine an diesem Tag.</p>}
          {sorted.map((b) => (
            <div key={b.id} className="agenda-row">
              <span className="agenda-time">
                {b.start_time.slice(0, 5)}–{b.end_time.slice(0, 5)}
              </span>
              <span className="agenda-name">{b.name}</span>
              {b.user_id === myUserId && (
                <button
                  className="agenda-cancel"
                  disabled={busy}
                  onClick={() => onCancel(b)}
                  aria-label="Termin stornieren"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="time-form">
          <div className="time-fields">
            <label>
              Von
              <input type="time" value={start} onChange={(e) => setStart(e.target.value)} step="900" />
            </label>
            <label>
              Bis
              <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} step="900" />
            </label>
          </div>
          {!valid && <p className="modal-hint">Die Endzeit muss nach der Startzeit liegen.</p>}
          <button
            className="btn-primary"
            disabled={busy || !valid}
            onClick={() => onBook(resource, dateKey, start, end, myName)}
          >
            {busy ? "Buche…" : `Für ${myName} buchen`}
          </button>
        </div>

        <button className="btn-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}
