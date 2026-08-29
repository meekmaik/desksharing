import { useState } from "react";
import { supabase } from "./supabaseClient";

const MODES = { SIGN_IN: "sign_in", SIGN_UP: "sign_up", RESET: "reset" };

export default function AuthGate({ notice }) {
  const [mode, setMode] = useState(MODES.SIGN_IN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      const msg = err.message?.toLowerCase() || "";
      if (msg.includes("not confirmed")) {
        setError("Bitte bestätige zuerst deine E-Mail-Adresse – der Link liegt in deinem Postfach.");
      } else if (msg.includes("rate limit") || msg.includes("security purposes")) {
        setError("Zu viele Versuche. Bitte warte kurz und versuche es dann erneut.");
      } else {
        setError("E-Mail oder Passwort ist falsch.");
      }
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!displayName.trim()) {
      setError("Bitte gib deinen Namen ein.");
      return;
    }
    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() },
        // Nach dem Klick auf den Bestätigungslink landet man wieder in der App
        // (statt auf einer leeren Seite).
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    setBusy(false);
    if (err) {
      setError(
        err.message?.includes("already registered")
          ? "Für diese E-Mail existiert bereits ein Konto. Bitte einloggen."
          : "Registrierung fehlgeschlagen. Bitte prüfe deine Angaben."
      );
      return;
    }
    setInfo("Konto erstellt! Falls eine Bestätigungs-Mail nötig ist, schau in dein Postfach.");
  };

  const handleReset = async (e) => {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    });
    setBusy(false);
    setInfo("Falls ein Konto mit dieser E-Mail existiert, wurde ein Link zum Zurücksetzen gesendet.");
  };

  return (
    <div className="name-gate">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${mode === MODES.SIGN_IN ? "active" : ""}`}
          onClick={() => {
            setMode(MODES.SIGN_IN);
            resetMessages();
          }}
        >
          Einloggen
        </button>
        <button
          className={`auth-tab ${mode === MODES.SIGN_UP ? "active" : ""}`}
          onClick={() => {
            setMode(MODES.SIGN_UP);
            resetMessages();
          }}
        >
          Registrieren
        </button>
      </div>

      {notice && !error && !info && <div className="modal-error">{notice}</div>}
      {error && <div className="modal-error">{error}</div>}
      {info && <div className="modal-info">{info}</div>}

      {mode === MODES.SIGN_IN && (
        <form className="name-gate-form" onSubmit={handleSignIn}>
          <label>
            E-Mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Passwort
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Einen Moment…" : "Einloggen"}
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(MODES.RESET);
              resetMessages();
            }}
          >
            Passwort vergessen?
          </button>
        </form>
      )}

      {mode === MODES.SIGN_UP && (
        <form className="name-gate-form" onSubmit={handleSignUp}>
          <label>
            Name
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Vor- und Nachname"
              maxLength={60}
              required
            />
          </label>
          <label>
            E-Mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Passwort
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Einen Moment…" : "Konto erstellen"}
          </button>
        </form>
      )}

      {mode === MODES.RESET && (
        <form className="name-gate-form" onSubmit={handleReset}>
          <label>
            E-Mail
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Einen Moment…" : "Link zum Zurücksetzen senden"}
          </button>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              setMode(MODES.SIGN_IN);
              resetMessages();
            }}
          >
            Zurück zum Login
          </button>
        </form>
      )}
    </div>
  );
}
