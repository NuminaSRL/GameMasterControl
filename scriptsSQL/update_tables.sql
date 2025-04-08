-- Aggiorna la tabella flt_games per aggiungere start_date e end_date e rimuovere colonne non necessarie
ALTER TABLE flt_games 
ADD COLUMN start_date TIMESTAMP,
ADD COLUMN end_date TIMESTAMP;

-- Aggiorna la tabella flt_game_settings per aggiungere difficulty
ALTER TABLE flt_game_settings
ADD COLUMN difficulty INTEGER NOT NULL DEFAULT 1;

-- Crea la tabella flt_rewards se non esiste
CREATE TABLE IF NOT EXISTS flt_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  game_id UUID REFERENCES flt_games(id),
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  available INTEGER NOT NULL,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migra i dati dalla tabella rewards a flt_rewards
INSERT INTO flt_rewards (name, description, type, value, icon, color, available, active, image_url)
SELECT name, description, type, value, icon, color, available, TRUE, image_url
FROM rewards
WHERE NOT EXISTS (SELECT 1 FROM flt_rewards WHERE flt_rewards.name = rewards.name);

-- Collega i rewards ai giochi Feltrinelli
WITH reward_mappings AS (
  SELECT 
    r.id AS reward_id,
    fg.id AS game_id
  FROM rewards r
  JOIN flt_games fg ON fg.feltrinelli_id = 
    CASE 
      WHEN r.game_type = 'books' THEN '00000000-0000-0000-0000-000000000001'::UUID
      WHEN r.game_type = 'authors' THEN '00000000-0000-0000-0000-000000000002'::UUID
      WHEN r.game_type = 'years' THEN '00000000-0000-0000-0000-000000000003'::UUID
      ELSE NULL
    END
  WHERE fg.id IS NOT NULL AND r.game_type IS NOT NULL
)
UPDATE flt_rewards fr
SET game_id = rm.game_id
FROM reward_mappings rm
WHERE fr.name IN (SELECT name FROM rewards WHERE id = rm.reward_id)
AND fr.game_id IS NULL;