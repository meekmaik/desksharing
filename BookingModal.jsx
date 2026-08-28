import { useState } from "react";
import { formatDateLong } from "./dateUtils";

export default function BookingModal({
  resource,
  dateKey,
  horizon,
  existingBooking,
  myUserId,
  myName,
  busy,
  error,
  onClose,
  onBook,
  onCancel,
}) {
  const [seriesOn, setSeriesOn] = useState(false);
  const [selectedDates, setSelectedDates] = useState([dateKey]);

  const sameWeekdayDates = horizon
    .filter((d) => new Date(d.key).getDay() === new Date(dateKey).getDay())
    .map((d) => d.key);
  const allDates = horizon.map((d) => d.key);

  const toggleDate = (key) => {
    setSelectedDates((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const isMine = existingBooking && existingBooking.user_id === myUserId;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{resource.label}</div>
        <div className="modal-sub">{formatDateLong(dateKey)}</div>

        {error && <div className="modal-error">{error}</div>}

        {existingBooking ? (
          <>
            <p className="modal-text">
              Gebucht von <strong>{existingBooking.name}</strong>
            </p>
            {isMine ? (
              <div className="modal-actions">
                <button
                  className="btn-danger"
                  disabled={busy}
                  onClick={() => onCancel(existingBooking, "single")}
                >
                  Diesen Tag stornieren
                </button>
                {existingBooking.series_id && (
                  <button
                    className="btn-secondary"
                    disabled={busy}
                    onClick={() => onCancel(existingBooking, "series")}
                  >
                    Ganze Serie stornieren
                  </button>
                )}
              </div>
            ) : (
              <p className="modal-hint">Nur die buchende Person kann stornieren.</p>
            )}
          </>
        ) : (
          <>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={seriesOn}
                onChange={(e) => {
                  setSeriesOn(e.target.checked);
                  if (e.target.checked) setSelectedDates(sameWeekdayDates);
                  else setSelectedDates([dateKey]);
                }}
              />
              Serienbuchung (mehrere Tage auf einmal)
            </label>

            {seriesOn && (
              <div className="series-box">
                <div className="series-quick">
                  <button
                    type="button"
                    className="chip"
                    onClick={() => setSelectedDates(sameWeekdayDates)}
                  >
                    Gleicher Wochentag ({horizon.find((d) => d.key === dateKey)?.weekday})
                  </button>
                  <button type="button" className="chip" onClick={() => setSelectedDates(allDates)}>
                    Alle Werktage (14 Tage)
                  </button>
                </div>
                <div className="series-list">
                  {horizon.map((d) => (
                    <label key={d.key} className="checkbox-row small">
                      <input
                        type="checkbox"
                        checked={selectedDates.includes(d.key)}
                        onChange={() => toggleDate(d.key)}
                      />
                      {d.weekday}, {d.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              disabled={busy || selectedDates.length === 0}
              onClick={() => onBook(resource, selectedDates, myName)}
            >
              {busy
                ? "Buche…"
                : selectedDates.length > 1
                ? `Für ${myName} buchen (${selectedDates.length} Tage)`
                : `Für ${myName} buchen`}
            </button>
          </>
        )}

        <button className="btn-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}
