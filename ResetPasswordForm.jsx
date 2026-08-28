import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) {
      setError("Konnte Passwort nicht setzen. Bitte fordere einen neuen Link an.");
      return;
    }
    setDone(true);
  };

  return (
    <div className="name-gate">
      <div className="name-gate-form">
        <label style={{ fontWeight: 700 }}>Neues Passwort setzen</label>
        {done ? (
          <p className="modal-info">Passwort gesetzt! Du bist jetzt eingeloggt.</p>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="modal-error">{error}</div>}
            <label>
              Neues Passwort
              <input
                type="password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? "Einen Moment…" : "Passwort speichern"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
