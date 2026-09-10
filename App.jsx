import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { isConfigured } from "./supabaseClient";
import { TOAST_MS } from "./config";
import { useAuth } from "./useAuth";
import { useBookings, FULLDAY_RESOURCE_COUNT } from "./useBookings";
import { useBookingActions } from "./useBookingActions";

import FloorPlan from "./FloorPlan";
import DatePicker from "./DatePicker";
import AuthGate from "./AuthGate";
import ResetPasswordForm from "./ResetPasswordForm";
import BookingModal from "./BookingModal";
import MeetingRoomModal from "./MeetingRoomModal";
import MyBookingsPanel from "./MyBookingsPanel";
import WhoIsInPanel from "./WhoIsInPanel";
import AdminPanel from "./AdminPanel";

/** Kurze Rückmeldung unten am Bildschirm ("Gebucht.", "Storniert."). */
function useToast() {
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const show = useCallback((text) => {
    setMessage(text);
    // Vorherigen Timer stoppen, sonst verschwindet eine neue Meldung zu
    // früh, wenn kurz zuvor schon eine angezeigt wurde.
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  // Timer beim Verlassen der Seite aufräumen.
  useEffect(() => () => clearTimeout(timer.current), []);

  return { message, show };
}

export default function App() {
  const toast = useToast();
  const auth = useAuth(toast.show);
  const bookings = useBookings(auth.userId, toast.show);

  const [modal, setModal] = useState(null);

  const closeModal = useCallback(() => setModal(null), []);

  const actions = useBookingActions({
    userId: auth.userId,
    reload: bookings.reload,
    onToast: toast.show,
    onClose: closeModal,
  });

  // Beim Schließen auch eine noch angezeigte Fehlermeldung zurücksetzen.
  const dismissModal = useCallback(() => {
    closeModal();
    actions.clearError();
  }, [closeModal, actions]);

  // Nach dem Abmelden (auch in einem anderen Tab) keine offenen Dialoge
  // mit toten Buttons stehen lassen.
  useEffect(() => {
    if (!auth.session) setModal(null);
  }, [auth.session]);

  // Escape schließt den offenen Dialog.
  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => e.key === "Escape" && dismissModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, dismissModal]);

  const openResource = (resource) => {
    actions.clearError();
    setModal({ type: resource.timeBased ? "timed" : "fullday", resource });
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

  if (auth.loading) return <div className="loading">Lade…</div>;

  if (auth.passwordRecovery) {
    return (
      <div className="page">
        <ResetPasswordForm onDone={auth.endPasswordRecovery} />
      </div>
    );
  }

  // Aktueller Stand des geöffneten Platzes. Bewusst bei jedem Rendern neu
  // ermittelt statt beim Öffnen eingefroren: bucht jemand anderes den
  // Platz, während der Dialog offen ist, zeigt er das sofort an.
  const openBookings = modal?.resource ? bookings.byResource[modal.resource.id] || [] : [];
  const existingBooking = openBookings[0] || null;

  const myBookingElsewhere =
    bookings.myFullDayBooking && bookings.myFullDayBooking.resource_id !== modal?.resource?.id
      ? bookings.myFullDayBooking
      : null;

  return (
    <div className="page">
      <header className="app-header">
        <div>
          <h1>Arbeitsplatz-Buchung</h1>
        </div>
        <div className="header-actions">
          {auth.session && (
            <>
              <span className="hello">Hallo, {auth.displayName}</span>
              <button className="btn-secondary" onClick={() => setModal({ type: "who-is-in" })}>
                Wer ist da?
              </button>
              <button className="btn-secondary" onClick={() => setModal({ type: "my-bookings" })}>
                Meine Buchungen
              </button>
              {auth.isAdmin && (
                <button className="btn-secondary" onClick={() => setModal({ type: "admin" })}>
                  Admin-Bereich
                </button>
              )}
              <button className="btn-secondary" onClick={auth.logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {!auth.session ? (
        <AuthGate notice={auth.notice} />
      ) : (
        <>
          <DatePicker
            horizon={bookings.horizon}
            selectedKey={bookings.selectedDateKey}
            onSelect={bookings.setSelectedDateKey}
          />

          <div className="legend">
            <LegendItem status="free" text="frei" />
            <LegendItem status="booked" text="belegt" />
            <LegendItem status="mine" text="deine Buchung" />
            <span className="legend-count">
              {bookings.bookedFullDayCount}/{FULLDAY_RESOURCE_COUNT} Plätze belegt
            </span>
          </div>

          {bookings.loading ? (
            <div className="loading">Lade Grundriss…</div>
          ) : (
            <FloorPlan
              bookings={bookings.byResource}
              myUserId={auth.userId}
              onSelect={openResource}
            />
          )}
        </>
      )}

      {modal?.type === "fullday" && (
        <BookingModal
          resource={modal.resource}
          dateKey={bookings.selectedDateKey}
          horizon={bookings.horizon}
          existingBooking={existingBooking}
          myExistingElsewhere={myBookingElsewhere}
          myBookedDates={bookings.myBookedDates}
          myUserId={auth.userId}
          myName={auth.displayName}
          busy={actions.busy}
          error={actions.error}
          onClose={dismissModal}
          onBook={actions.bookFullDay}
          onCancel={actions.cancelFullDay}
        />
      )}

      {modal?.type === "timed" && (
        <MeetingRoomModal
          resource={modal.resource}
          dateKey={bookings.selectedDateKey}
          entries={openBookings}
          myUserId={auth.userId}
          myName={auth.displayName}
          busy={actions.busy}
          error={actions.error}
          onClose={dismissModal}
          onBook={actions.bookTimed}
          onCancel={actions.cancelTimed}
        />
      )}

      {modal?.type === "who-is-in" && (
        <WhoIsInPanel
          bookingsForDate={bookings.byResource}
          dateKey={bookings.selectedDateKey}
          onClose={dismissModal}
        />
      )}

      {modal?.type === "my-bookings" && (
        <MyBookingsPanel
          allBookings={bookings.allBookings}
          myUserId={auth.userId}
          busy={actions.busy}
          onCancel={(booking, mode) => actions.cancelFullDay(booking, mode, true)}
          onClose={dismissModal}
        />
      )}

      {modal?.type === "admin" && auth.isAdmin && (
        <AdminPanel myUserId={auth.userId} onClose={dismissModal} />
      )}

      {toast.message && <div className="toast">{toast.message}</div>}
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
