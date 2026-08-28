import { useEffect, useMemo, useState, useCallback } from "react";
import "./App.css";
import { supabase, isConfigured } from "./supabaseClient";
import { RESOURCES } from "./floorplanData";
import { getBookingHorizon } from "./dateUtils";

import FloorPlan from "./FloorPlan";
import DatePicker from "./DatePicker";
import AuthGate from "./AuthGate";
import ResetPasswordForm from "./ResetPasswordForm";
import BookingModal from "./BookingModal";
import MeetingRoomModal from "./MeetingRoomModal";
import MyBookingsPanel from "./MyBookingsPanel";

const FULLDAY_RESOURCE_COUNT = RESOURCES.filter((r) => !r.timeBased).length;

export default function App() {
  const horizon = useMemo(() => getBookingHorizon(14), []);
  const [session, setSession] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const [selectedDateKey, setSelectedDateKey] = useState(horizon[0].key);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ---- Login-Status verwalten ----
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") {
        setPasswordRecovery(true);
      }
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ---- Anzeigenamen aus dem Profil laden ----
  useEffect(() => {
    if (!supabase || !session) {
      setDisplayName("");
      return;
    }
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => setDisplayName(data?.display_name || session.user.email));
  }, [session]);

  const myUserId = session?.user?.id || null;

  const loadBookings = useCallback(async () => {
    if (!supabase || !session) {
      setLoading(false);
      return;
    }
    const from = horizon[0].key;
    const to = horizon[horizon.length - 1].key;
    const { data, error: err } = await supabase
      .from("bookings")
      .select("*")
      .gte("date", from)
      .lte("date", to);
    if (err) {
      showToast("Buchungen konnten nicht geladen werden.");
    } else {
      setAllBookings(data || []);
    }
    setLoading(false);
  }, [horizon, session]);

  useEffect(() => {
    loadBookings();
    if (!supabase || !session) return;
    const channel = supabase
      .channel("bookings-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        loadBookings();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBookings, session]);

  const bookingsForSelectedDate = useMemo(() => {
    const idx = {};
    for (const b of allBookings) {
      if (b.date !== selectedDateKey) continue;
      if (!idx[b.resource_id]) idx[b.resource_id] = [];
      idx[b.resource_id].push(b);
    }
    return idx;
  }, [allBookings, selectedDateKey]);

  const bookedFullDayCount = useMemo(() => {
    return RESOURCES.filter((r) => !r.timeBased && bookingsForSelectedDate[r.id]?.length).length;
  }, [bookingsForSelectedDate]);

  // Eigene ganztägige Buchung an diesem Tag (Besprechungsraum zählt nicht,
  // da zeitbasiert / start_time gesetzt).
  const myFullDayBookingToday = useMemo(() => {
    return allBookings.find(
      (b) => b.user_id === myUserId && b.date === selectedDateKey && b.start_time === null
    );
  }, [allBookings, myUserId, selectedDateKey]);

  const openResource = (resource) => {
    setError(null);
    if (resource.timeBased) {
      setModal({ type: "timed", resource });
    } else {
      const existing = bookingsForSelectedDate[resource.id]?.[0] || null;
      setModal({ type: "fullday", resource, existing });
    }
  };

  const closeModal = () => {
    setModal(null);
    setError(null);
  };

  const handleBookFullDay = async (resource, dates, name) => {
    setBusy(true);
    setError(null);
    const seriesId = dates.length > 1 ? crypto.randomUUID() : null;
    const failed = [];
    for (const date of dates) {
      const { error: err } = await supabase.from("bookings").insert({
        resource_id: resource.id,
        date,
        name,
        user_id: myUserId,
        series_id: seriesId,
      });
      if (err) failed.push(date);
    }
    setBusy(false);
    await loadBookings();
    if (failed.length === 0) {
      closeModal();
      showToast(dates.length > 1 ? `${dates.length} Tage gebucht.` : "Gebucht.");
    } else if (failed.length === dates.length) {
      setError("Diese(r) Termin(e) ist/sind bereits belegt.");
    } else {
      showToast(`${dates.length - failed.length} von ${dates.length} Tagen gebucht (Rest bereits belegt).`);
      closeModal();
    }
  };

  const handleCancelFullDay = async (booking, mode) => {
    setBusy(true);
    setError(null);
    const query = supabase.from("bookings").delete();
    const { error: err } =
      mode === "series"
        ? await query.eq("series_id", booking.series_id)
        : await query.eq("id", booking.id);
    setBusy(false);
    if (err) {
      setError("Stornieren fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    await loadBookings();
    closeModal();
    showToast("Storniert.");
  };

  const handleBookTimed = async (resource, dateKey, start, end, name) => {
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.from("bookings").insert({
      resource_id: resource.id,
      date: dateKey,
      start_time: start,
      end_time: end,
      name,
      user_id: myUserId,
    });
    setBusy(false);
    if (err) {
      setError(err.message?.includes("überschneidet") ? err.message : "Buchung fehlgeschlagen.");
      return;
    }
    await loadBookings();
    showToast("Termin gebucht.");
  };

  const handleCancelTimed = async (booking) => {
    setBusy(true);
    const { error: err } = await supabase.from("bookings").delete().eq("id", booking.id);
    setBusy(false);
    if (err) {
      setError("Stornieren fehlgeschlagen.");
      return;
    }
    await loadBookings();
    showToast("Termin storniert.");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!isConfigured) {
    return (
      <div className="setup-notice">
        <h1>Fast fertig ⚙️</h1>
        <p>
          Diese App ist noch nicht mit Supabase verbunden. Bitte trage die Zugangsdaten in{" "}
          <code>supabaseClient.js</code> ein.
        </p>
      </div>
    );
  }

  if (authLoading) {
    return <div className="loading">Lade…</div>;
  }

  if (passwordRecovery) {
    return (
      <div className="page">
        <ResetPasswordForm />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <h1>Arbeitsplatz-Buchung</h1>
        </div>
        <div className="header-actions">
          {session && (
            <>
              <span className="hello">Hallo, {displayName}</span>
              <button className="btn-secondary" onClick={() => setModal({ type: "my-bookings" })}>
                Meine Buchungen
              </button>
              <button className="btn-secondary" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {!session ? (
        <AuthGate />
      ) : (
        <>
          <DatePicker horizon={horizon} selectedKey={selectedDateKey} onSelect={setSelectedDateKey} />

          <div className="legend">
            <LegendItem status="free" text="frei" />
            <LegendItem status="booked" text="belegt" />
            <LegendItem status="mine" text="deine Buchung" />
            <span className="legend-count">
              {bookedFullDayCount}/{FULLDAY_RESOURCE_COUNT} Plätze belegt
            </span>
          </div>

          {loading ? (
            <div className="loading">Lade Grundriss…</div>
          ) : (
            <FloorPlan bookings={bookingsForSelectedDate} myUserId={myUserId} onSelect={openResource} />
          )}
        </>
      )}

      {modal?.type === "fullday" && (
        <BookingModal
          resource={modal.resource}
          dateKey={selectedDateKey}
          horizon={horizon}
          existingBooking={modal.existing}
          myExistingElsewhere={
            myFullDayBookingToday && myFullDayBookingToday.resource_id !== modal.resource.id
              ? myFullDayBookingToday
              : null
          }
          myUserId={myUserId}
          myName={displayName}
          busy={busy}
          error={error}
          onClose={closeModal}
          onBook={handleBookFullDay}
          onCancel={handleCancelFullDay}
        />
      )}

      {modal?.type === "timed" && (
        <MeetingRoomModal
          resource={modal.resource}
          dateKey={selectedDateKey}
          entries={bookingsForSelectedDate[modal.resource.id] || []}
          myUserId={myUserId}
          myName={displayName}
          busy={busy}
          error={error}
          onClose={closeModal}
          onBook={handleBookTimed}
          onCancel={handleCancelTimed}
        />
      )}

      {modal?.type === "my-bookings" && (
        <MyBookingsPanel
          allBookings={allBookings}
          myUserId={myUserId}
          busy={busy}
          onCancel={handleCancelFullDay}
          onClose={closeModal}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function LegendItem({ status, text }) {
  return (
    <span className={`legend-item legend-${status}`}>
      <span className="legend-swatch" />
      {text}
    </span>
  );
}
