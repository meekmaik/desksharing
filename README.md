# Arbeitsplatz-Buchung – Kurzanleitung

## Supabase
Eigenes, separates Supabase-Projekt. Schema (inkl. Login/Profile) einmal
komplett aus `schema-full.sql` im SQL-Editor ausführen. Zugangsdaten stehen
fest in `supabaseClient.js`. Änderst du später das Supabase-Projekt: Werte
dort ersetzen und committen – GitHub Actions baut automatisch neu.

## Deployment: GitHub Pages
1. Alle Dateien dieses Ordners liegen 1:1 so im GitHub-Repository
   (Root-Dateien + `.github/workflows/deploy.yml`).
2. Repository muss **Public** sein.
3. Settings → Pages → Source: **GitHub Actions**.
4. Jeder Commit auf `main` löst automatisch Build + Deploy aus.
5. Live-URL erscheint unter Settings → Pages, z. B.
   `https://DEINUSERNAME.github.io/desksharing/`.

## Wichtig: vite.config.js
`base: '/desksharing/'` muss exakt dem Namen dieses GitHub-Repositorys
entsprechen.

## Features
- Web & Mobile, Login (E-Mail + Passwort, inkl. „Passwort vergessen")
- Buchung bis zu 14 Werktage im Voraus
- Barrierefreie Farbcodierung (Türkis = frei, Orange = belegt, Navy =
  eigene Buchung)
- Serienbuchungen
- Besprechungsraum mit exakter Uhrzeit, Tages-Agenda, Überschneidungsschutz
- „Meine Buchungen"-Übersicht, Live-Updates, Auslastungsanzeige
- Buchungen sind an den Account gebunden, nur eigene stornierbar
  (durch die Datenbank selbst erzwungen, nicht nur die Oberfläche)

## Noch nicht enthalten (kommt später)
- Admin-Bereich (Tische/Räume verwalten, Nutzer verwalten). Die
  Grundlage dafür (`profiles.is_admin`) ist in der Datenbank schon
  angelegt.
