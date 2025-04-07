-- Tabelle per i badge e premi degli utenti

-- Crea tabella per i badge degli utenti
CREATE TABLE IF NOT EXISTS flt_user_badges (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_flt_user_badges_user_id ON flt_user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_user_badges_badge_id ON flt_user_badges(badge_id);

-- Crea tabella per le statistiche degli utenti
CREATE TABLE IF NOT EXISTS flt_user_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id INTEGER NOT NULL,
  games_played INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  wrong_answers INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  avg_time_per_question FLOAT DEFAULT 0,
  last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_flt_user_stats_user_id ON flt_user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_user_stats_game_id ON flt_user_stats(game_id);

-- Verifica l'esistenza della tabella flt_user_rewards
CREATE TABLE IF NOT EXISTS flt_user_rewards (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID NOT NULL REFERENCES flt_rewards(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indici per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_flt_user_rewards_user_id ON flt_user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_flt_user_rewards_reward_id ON flt_user_rewards(reward_id);

-- Inserisci alcuni dati di esempio (da eseguire solo in ambiente di sviluppo)
-- Badge per l'utente marco
INSERT INTO flt_user_badges (user_id, badge_id)
VALUES 
('b1a4d19b-f0a1-453c-bbc1-d41b1489b7a8', 9),  -- Lettore Esperto per Marco
('b1a4d19b-f0a1-453c-bbc1-d41b1489b7a8', 10)  -- Risposte Rapide per Marco
ON CONFLICT DO NOTHING;

-- Statistiche di esempio per l'utente marco
INSERT INTO flt_user_stats (user_id, game_id, games_played, correct_answers, wrong_answers, total_points, best_score, avg_time_per_question)
VALUES 
('b1a4d19b-f0a1-453c-bbc1-d41b1489b7a8', 1, 5, 12, 3, 120, 30, 4.5)  -- Statistiche di Marco per IndovinaLibro
ON CONFLICT DO NOTHING;
