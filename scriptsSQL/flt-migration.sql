-- Tabelle per l'integrazione con Feltrinelli

-- Tabella per i profili utente
CREATE TABLE IF NOT EXISTS flt_user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  internal_user_id INTEGER REFERENCES users(id),
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per mappare i giochi Feltrinelli ai nostri giochi
CREATE TABLE IF NOT EXISTS flt_games (
  id UUID PRIMARY KEY,
  feltrinelli_id UUID NOT NULL UNIQUE,
  internal_id INTEGER NOT NULL REFERENCES games(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le sessioni di gioco
CREATE TABLE IF NOT EXISTS flt_game_sessions (
  id UUID PRIMARY KEY,
  session_id UUID NOT NULL UNIQUE,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  internal_game_id INTEGER REFERENCES games(id),
  score INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le risposte alle domande
CREATE TABLE IF NOT EXISTS flt_answer_options (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL,
  book_id UUID NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le classifiche
CREATE TABLE IF NOT EXISTS flt_leaderboard (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  internal_game_id INTEGER REFERENCES games(id),
  points INTEGER NOT NULL DEFAULT 0,
  period TEXT NOT NULL CHECK (period IN ('all_time', 'monthly', 'weekly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per i premi assegnati agli utenti
CREATE TABLE IF NOT EXISTS flt_user_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id INTEGER NOT NULL REFERENCES rewards(id),
  game_id UUID NOT NULL,
  internal_game_id INTEGER REFERENCES games(id),
  period TEXT NOT NULL CHECK (period IN ('all_time', 'monthly', 'weekly')),
  rank INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_flt_user_profiles_user_id ON flt_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_games_feltrinelli_id ON flt_games(feltrinelli_id);
CREATE INDEX IF NOT EXISTS idx_flt_games_internal_id ON flt_games(internal_id);
CREATE INDEX IF NOT EXISTS idx_flt_game_sessions_session_id ON flt_game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_flt_game_sessions_user_id ON flt_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_game_sessions_game_id ON flt_game_sessions(game_id);
CREATE INDEX IF NOT EXISTS idx_flt_answer_options_question_id ON flt_answer_options(question_id);
CREATE INDEX IF NOT EXISTS idx_flt_leaderboard_user_id ON flt_leaderboard(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_leaderboard_game_id ON flt_leaderboard(game_id);
CREATE INDEX IF NOT EXISTS idx_flt_leaderboard_period ON flt_leaderboard(period);
CREATE INDEX IF NOT EXISTS idx_flt_user_rewards_user_id ON flt_user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_user_rewards_reward_id ON flt_user_rewards(reward_id);

-- Inserimento dei mapping predefiniti per i giochi
INSERT INTO flt_games (id, feltrinelli_id, internal_id, name, description, is_active)
SELECT 
  gen_random_uuid(), 
  '00000000-0000-0000-0000-000000000001', 
  id, 
  name, 
  description, 
  is_active
FROM games 
WHERE game_type = 'books' AND name LIKE '%Libro%'
ON CONFLICT (feltrinelli_id) DO NOTHING;

INSERT INTO flt_games (id, feltrinelli_id, internal_id, name, description, is_active)
SELECT 
  gen_random_uuid(), 
  '00000000-0000-0000-0000-000000000002', 
  id, 
  name, 
  description, 
  is_active
FROM games 
WHERE game_type = 'authors' AND name LIKE '%Autore%'
ON CONFLICT (feltrinelli_id) DO NOTHING;

INSERT INTO flt_games (id, feltrinelli_id, internal_id, name, description, is_active)
SELECT 
  gen_random_uuid(), 
  '00000000-0000-0000-0000-000000000003', 
  id, 
  name, 
  description, 
  is_active
FROM games 
WHERE game_type = 'years' AND name LIKE '%Anno%'
ON CONFLICT (feltrinelli_id) DO NOTHING;