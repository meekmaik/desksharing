import { useState, useMemo } from "react";
import { getResource } from "./floorplanData";
import { formatDateLong } from "./dateUtils";

// Zeigt, wer an einem Tag wo sitzt – inklusive Suche.
// In Desk-Booking-Apps eines der meistgenutzten Features ("wo sitzt X heute?").
export default function WhoIsInPanel({ bookingsForDate, dateKey, onClose }) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const all = Object.values(bookingsForDate).flat();
    return all
      .map((b) => ({
        id: b.id,
        name: b.name,
        place: getResource(b.resource_id)?.label || b.resource_id,
        time:
          b.start_time && b.end_time
            ? `${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}`
            : null,
      }))
      .filter((r) => r.name?.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [bookingsForDate, query]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Wer ist da?</div>
        <div className="modal-sub">{formatDateLong(dateKey)}</div>

        <input
          className="search-input"
          placeholder="Namen suchen…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {rows.length === 0 ? (
          <p className="modal-hint">
            {query ? "Niemand gefunden." : "An diesem Tag ist noch nichts gebucht."}
          </p>
        ) : (
          <div className="who-list">
            {rows.map((r) => (
              <div key={r.id} className="who-row">
                <span className="who-name">{r.name}</span>
                <span className="who-place">
                  {r.place}
                  {r.time && <span className="who-time"> · {r.time}</span>}
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="btn-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}
