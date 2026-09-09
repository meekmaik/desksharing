import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { getResource } from "./floorplanData";
import { toDateKey } from "./dateUtils";

const ACTION_LABELS = {
  grant_admin: "Admin-Rechte vergeben",
  revoke_admin: "Admin-Rechte entzogen",
  cancel_booking: "Fremde Buchung storniert",
};

// Zwei-Klick-Bestätigung für heikle Aktionen (Admin entfernen, fremde
// Buchung stornieren) statt eines Browser-confirm()-Popups. Setzt sich
// nach ein paar Sekunden von selbst zurück, falls nicht bestätigt wird.
function ConfirmButton({ label, confirmLabel, onConfirm, disabled, danger }) {
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <button
      type="button"
      className={`btn-small ${danger ? "btn-danger" : ""} ${confirming ? "is-confirming" : ""}`}
      disabled={disabled}
      onClick={() => {
        if (confirming) {
          setConfirming(false);
          onConfirm();
        } else {
          setConfirming(true);
        }
      }}
    >
      {confirming ? confirmLabel || "Wirklich?" : label}
    </button>
  );
}

export default function AdminPanel({ myUserId, onClose }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [log, setLog] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    const { data, error: err } = await supabase
      .from("profiles")
      .select("id, display_name, is_admin, created_at")
      .order("display_name", { ascending: true });
    if (err) setError("Nutzerliste konnte nicht geladen werden.");
    else setUsers(data || []);
  };

  const loadBookings = async () => {
    const today = toDateKey(new Date());
    const { data, error: err } = await supabase
      .from("bookings")
      .select("*")
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true, nullsFirst: true });
    if (err) setError("Buchungen konnten nicht geladen werden.");
    else setBookings(data || []);
  };

  const loadLog = async () => {
    const { data, error: err } = await supabase
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (err) setError("Protokoll konnte nicht geladen werden.");
    else setLog(data || []);
  };

  useEffect(() => {
    setError(null);
    if (tab === "users" && users === null) loadUsers();
    if (tab === "bookings" && bookings === null) loadBookings();
    if (tab === "log" && log === null) loadLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const toggleAdmin = async (user) => {
    setBusyId(user.id);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .update({ is_admin: !user.is_admin })
      .eq("id", user.id);
    setBusyId(null);
    if (err) {
      // Die Datenbank liefert bei "letzter Admin" schon eine verständliche,
      // deutsche Meldung -- die zeigen wir 1:1 an statt eines generischen Texts.
      setError(err.message);
      return;
    }
    await loadUsers();
  };

  const cancelBooking = async (booking) => {
    setBusyId(booking.id);
    setError(null);
    const { error: err } = await supabase.from("bookings").delete().eq("id", booking.id);
    setBusyId(null);
    if (err) {
      setError("Stornieren fehlgeschlagen.");
      return;
    }
    await loadBookings();
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Admin-Bereich"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title">Admin-Bereich</div>

        <div className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${tab === "users" ? "active" : ""}`}
            onClick={() => setTab("users")}
          >
            Nutzer
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === "bookings" ? "active" : ""}`}
            onClick={() => setTab("bookings")}
          >
            Buchungen
          </button>
          <button
            type="button"
            className={`admin-tab ${tab === "log" ? "active" : ""}`}
            onClick={() => setTab("log")}
          >
            Protokoll
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <div className="admin-body">
          {tab === "users" &&
            (users === null ? (
              <p className="modal-hint">Lade…</p>
            ) : users.length === 0 ? (
              <p className="modal-hint">Keine Nutzer gefunden.</p>
            ) : (
              <div className="admin-list">
                {users.map((u) => (
                  <div key={u.id} className="admin-row">
                    <div className="admin-row-main">
                      <span className="admin-row-name">
                        {u.display_name}
                        {u.id === myUserId && <span className="admin-you"> (du)</span>}
                      </span>
                      {u.is_admin && <span className="admin-badge">Admin</span>}
                    </div>
                    <ConfirmButton
                      label={u.is_admin ? "Admin entfernen" : "Zum Admin machen"}
                      confirmLabel={
                        u.is_admin
                          ? u.id === myUserId
                            ? "Wirklich? Du verlierst dann selbst den Zugriff."
                            : "Wirklich entfernen?"
                          : "Wirklich zum Admin machen?"
                      }
                      danger={u.is_admin}
                      disabled={busyId === u.id}
                      onConfirm={() => toggleAdmin(u)}
                    />
                  </div>
                ))}
              </div>
            ))}

          {tab === "bookings" &&
            (bookings === null ? (
              <p className="modal-hint">Lade…</p>
            ) : bookings.length === 0 ? (
              <p className="modal-hint">Keine anstehenden Buchungen.</p>
            ) : (
              <div className="admin-list">
                {bookings.map((b) => {
                  const resource = getResource(b.resource_id);
                  return (
                    <div key={b.id} className="admin-row">
                      <div className="admin-row-main">
                        <span className="admin-row-name">{b.name}</span>
                        <span className="admin-row-sub">
                          {resource?.label || b.resource_id} · {b.date}
                          {b.start_time && ` · ${b.start_time.slice(0, 5)}–${b.end_time.slice(0, 5)}`}
                        </span>
                      </div>
                      <ConfirmButton
                        label="Stornieren"
                        confirmLabel="Wirklich stornieren?"
                        danger
                        disabled={busyId === b.id}
                        onConfirm={() => cancelBooking(b)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

          {tab === "log" &&
            (log === null ? (
              <p className="modal-hint">Lade…</p>
            ) : log.length === 0 ? (
              <p className="modal-hint">Noch keine Admin-Aktionen protokolliert.</p>
            ) : (
              <div className="admin-list">
                {log.map((entry) => (
                  <div key={entry.id} className="admin-row admin-row-log">
                    <div className="admin-row-main">
                      <span className="admin-row-name">{ACTION_LABELS[entry.action] || entry.action}</span>
                      <span className="admin-row-sub">
                        {entry.actor_name || "Unbekannt"} → {entry.target_name || "?"}
                        {entry.detail && ` · ${entry.detail}`}
                      </span>
                    </div>
                    <span className="admin-row-time">
                      {new Date(entry.created_at).toLocaleString("de-DE", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ))}
        </div>

        <button className="btn-close" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
}
