import { createClient } from "@supabase/supabase-js";

// ============================================================
// Supabase-Zugangsdaten. Änderst du dein Supabase-Projekt später,
// trägst du die neuen Werte einfach hier ein und committest die Datei
// (GitHub Actions baut die Seite dann automatisch neu).
// ============================================================
const SUPABASE_URL = "https://owfyrxjtbwkrqplvvuiy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93ZnlyeGp0YndrcnFwbHZ2dWl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MTYxMDksImV4cCI6MjEwMzQ5MjEwOX0.jgN4dHUpcnLGb4vnDdft5ANqom1xulRCQS8cSKzMAxI";

export const isConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
