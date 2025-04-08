-- Schema per la migrazione a Supabase
-- Esegui questo script nella SQL Editor della dashboard di Supabase

-- Tabella utenti
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
);

-- Tabella giochi
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  timer_duration INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  weekly_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  monthly_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  reward TEXT NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'books',
  feltrinelli_game_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
  difficulty INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabella badge
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabella di relazione game-badge
CREATE TABLE IF NOT EXISTS game_badges (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE(game_id, badge_id)
);

-- Tabella premi
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  available INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabella statistiche
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  total_games INTEGER NOT NULL DEFAULT 0,
  active_games INTEGER NOT NULL DEFAULT 0,
  active_users INTEGER NOT NULL DEFAULT 0,
  awarded_badges INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserisci dati iniziali
INSERT INTO stats (total_games, active_games, active_users, awarded_badges)
VALUES (0, 0, 0, 0)
ON CONFLICT DO NOTHING;

-- Inserisci un gioco di esempio se non ne esistono già
INSERT INTO games (name, description, is_active, timer_duration, question_count, weekly_leaderboard, monthly_leaderboard, reward, game_type, feltrinelli_game_id, difficulty)
SELECT 'Quiz Libri', 'Indovina il libro dal suo estratto', TRUE, 30, 10, TRUE, TRUE, 'points_100', 'books', '00000000-0000-0000-0000-000000000001', 1
WHERE NOT EXISTS (SELECT 1 FROM games LIMIT 1);

-- Crea i trigger per gestire automaticamente i campi created_at e updated_at
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aggiungi trigger a stats per aggiornare updated_at
DROP TRIGGER IF EXISTS set_timestamp ON stats;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON stats
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Aggiungi politiche di accesso (RLS) per Supabase
-- Questa è una configurazione di base che permette a tutti di leggere, ma solo alle chiamate autenticate con service_role di modificare
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

-- Politiche di accesso per utenti anonimi (lettura)
CREATE POLICY "Accesso pubblico in lettura per utenti" ON users FOR SELECT USING (true);
CREATE POLICY "Accesso pubblico in lettura per giochi" ON games FOR SELECT USING (true);
CREATE POLICY "Accesso pubblico in lettura per badge" ON badges FOR SELECT USING (true);
CREATE POLICY "Accesso pubblico in lettura per game_badges" ON game_badges FOR SELECT USING (true);
CREATE POLICY "Accesso pubblico in lettura per rewards" ON rewards FOR SELECT USING (true);
CREATE POLICY "Accesso pubblico in lettura per stats" ON stats FOR SELECT USING (true);

-- Solo il service role può inserire/aggiornare/eliminare
-- Questo è gestito dal fatto che stiamo usando la chiave service_role nel backend