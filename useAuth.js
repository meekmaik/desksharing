import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/**
 * Kapselt alles rund um den Login: Session, Profildaten (Anzeigename,
 * Admin-Status) und die Rückkehr aus E-Mail-Links.
 *
 * Bewusst als eigener Hook, damit App.jsx sich um die Darstellung kümmert
 * und diese Logik unabhängig davon getestet und geändert werden kann.
 *
 * @param {(msg: string) => void} onToast Kurze Rückmeldung anzeigen.
 */
export function useAuth(onToast) {
  const [session, setSession] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Kommt man über einen E-Mail-Link (Bestätigung / Passwort-Reset)
    // zurück, hängen Tokens oder ein Fehler im URL-Fragment. Das wird
    // ausgewertet und die Adresse anschließend aufgeräumt, damit niemand
    // auf einer Seite mit kryptischer URL landet.
    const hash = window.location.hash || "";
    const cameFromEmailLink = hash.includes("access_token") || hash.includes("error");

    if (hash.includes("error")) {
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const description = params.get("error_description") || "";
      setNotice(
        description.toLowerCase().includes("expired")
          ? "Der Link ist abgelaufen. Bitte fordere einen neuen an."
          : "Der Link konnte nicht verarbeitet werden. Bitte versuche es erneut."
      );
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (cameFromEmailLink) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_IN" && cameFromEmailLink) {
        setNotice(null);
        onToast?.("E-Mail bestätigt – willkommen!");
      }
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
    // Absichtlich nur beim ersten Rendern: der Listener meldet Änderungen
    // von selbst, ein Neu-Aufsetzen würde ihn nur unnötig abmelden.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Profildaten nachladen, sobald eine Session existiert.
  //
  // Wichtig: isAdmin steuert hier NUR, ob der Admin-Button sichtbar ist.
  // Die eigentliche Absicherung liegt in den Datenbank-Regeln (RLS) --
  // selbst wenn jemand den Button per Entwicklertools sichtbar macht,
  // kommt er ohne echte Admin-Rechte in der Datenbank nicht weiter.
  useEffect(() => {
    if (!supabase || !session) {
      setDisplayName("");
      setIsAdmin(false);
      return;
    }

    let cancelled = false;
    supabase
      .from("profiles")
      .select("display_name, is_admin")
      .eq("id", session.user.id)
      .single()
      .then(({ data }) => {
        // Abbrechen, falls sich die Session inzwischen geändert hat --
        // sonst könnte eine langsame Antwort den Namen einer bereits
        // abgemeldeten Person nachträglich wieder setzen.
        if (cancelled) return;
        const fallback = session.user.email?.split("@")[0] || "Ich";
        setDisplayName(data?.display_name || fallback);
        setIsAdmin(Boolean(data?.is_admin));
      });

    return () => {
      cancelled = true;
    };
  }, [session]);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    session,
    userId: session?.user?.id || null,
    displayName,
    isAdmin,
    loading,
    passwordRecovery,
    endPasswordRecovery: () => setPasswordRecovery(false),
    notice,
    logout,
  };
}
