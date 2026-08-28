# Arbeitsplatz-Buchung – Kurzanleitung

## Supabase einrichten
1. `schema-reset.sql` einmal komplett im SQL-Editor ausführen
   (setzt alles neu auf, inkl. Login, Rechte und Sicherheits-Trigger).
2. Bei einem **bestehenden** Projekt stattdessen `security-fix.sql` ausführen –
   das ergänzt nur die Sicherheits-Fixes, ohne Daten zu löschen.
3. Zugangsdaten stehen in `supabaseClient.js`.

## Wichtig: Auth-URLs setzen
Supabase → Authentication → **URL Configuration**:
- **Site URL**: `https://DEINUSERNAME.github.io/desksharing/`
- **Redirect URLs**: dieselbe Adresse ergänzen

Ohne das landen Bestätigungs- und Passwort-Reset-Links im Nichts.

## Deployment: GitHub Pages
- Repository muss **Public** sein.
- Settings → Pages → Source: **GitHub Actions**.
- `vite.config.js` → `base: '/desksharing/'` muss exakt dem Repo-Namen entsprechen.
- Jeder Commit auf `main` baut und veröffentlicht automatisch.

## Features
- Login (E-Mail + Passwort), Registrierung, Passwort vergessen
- Buchung bis 14 Werktage im Voraus, Serienbuchungen
- **Nur ein Platz pro Person und Tag** (Besprechungsraum ausgenommen)
- Besprechungsraum mit Uhrzeit, Tagesagenda direkt im Grundriss,
  Überschneidungsschutz
- "Wer ist da?" – Übersicht mit Namenssuche, wer an einem Tag wo sitzt
- "Meine Buchungen" mit Einzel- und Serienstornierung
- Live-Updates ohne Neuladen, Auslastungsanzeige
- Grundriss behält auf allen Geräten dieselben Proportionen

## Barrierefreiheit
Status wird **nicht nur** über Farbe unterschieden:
- frei = weiß gefüllt, farbiger Rand
- belegt = ausgefüllt
- eigene Buchung = ausgefüllt **mit Häkchen**

Das ist wichtig, weil Rot (#e30613) und Königsblau (#4169e1) zwar farblich
klar verschieden sind, aber fast dieselbe Helligkeit haben – in Graustufen
oder bei Blau-Gelb-Sehschwäche trägt nur die Form die Information.

## Sicherheit (in der Datenbank erzwungen, nicht nur in der Oberfläche)
- Nur eingeloggte Nutzer sehen und buchen
- Buchen nur auf den eigenen Account, stornieren nur eigene Buchungen
- Der Buchungsname wird serverseitig aus dem Profil gesetzt –
  Buchen unter fremdem Namen ist über die API nicht möglich
- `is_admin` kann von Nutzern nicht selbst gesetzt werden
- Buchungen nur für heute bis +30 Tage möglich

## Noch offen (nächster Ausbau)
Admin-Bereich: Nutzer verwalten, Tische/Räume bearbeiten, fremde Buchungen
stornieren. Die Grundlage (`profiles.is_admin`) ist bereits angelegt und
abgesichert.
