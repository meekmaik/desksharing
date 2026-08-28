import { getResource } from "./floorplanData";
import { formatDateLong } from "./dateUtils";

export default function MyBookingsPanel({ allBookings, myUserId, busy, onCancel, onClose }) {
  const mine = allBookings
    .filter((b) => b.user_id === myUserId)
    .sort((a, b) => (a.date + (a.start_time || "")).localeCompare(b.date + (b.start_time || "")));

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">Meine Buchungen</div>

        {mine.length === 0 ? (
          <p className="modal-hint">Du hast aktuell keine Buchungen in den nächsten 14 Tagen.</p>
        ) : (
          <div className="my-bookings-list">
            {mine.map((b) => {
              const res = getResource(b.resource_id);
              return (
                <div key={b.id} className="my-booking-row">
                  <div>
                    <div className="my-booking-resource">{res?.label || b.resource_id}</div>
                    <div className="my-booking-date">
                      {formatDateLong(b.date)}
                      {b.start_time && ` · ${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}`}
                    </div>
                  </div>
                  <div className="my-booking-actions">
                    <button className="btn-danger small" disabled={busy} onClick={() => onCancel(b, "single")}>
                      Stornieren
                    </button>
                    {b.series_id && (
                      <button
                        className="btn-secondary small"
                        disabled={busy}
                        onClick={() => onCancel(b, "series")}
                      >
                        Serie stornieren
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button className="btn-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}
