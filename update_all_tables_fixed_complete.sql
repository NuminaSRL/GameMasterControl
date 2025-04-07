-- Abilita l'estensione UUID se non è già attiva
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Aggiorna la tabella dei giochi con i campi data inizio e fine
ALTER TABLE flt_games
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Aggiorna le impostazioni di gioco con il campo difficoltà
ALTER TABLE flt_game_settings
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;

-- Aggiorna o crea la tabella dei premi
CREATE TABLE IF NOT EXISTS flt_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  value TEXT,
  icon TEXT,
  color TEXT,
  available INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rank INTEGER DEFAULT 0,
  game_id UUID REFERENCES flt_games(id)
);

-- Crea o aggiorna indici
CREATE INDEX IF NOT EXISTS idx_flt_rewards_is_active ON flt_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_flt_games_start_end_date ON flt_games(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_flt_rewards_game_id ON flt_rewards(game_id);

-- Inserisci i giochi di base (se non esistono)
INSERT INTO flt_games (id, feltrinelli_id, internal_id, name, description, is_active, created_at, updated_at, start_date, end_date)
VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'IndovinaLibro', 'Indovina il libro dall''estratto dell''abstract', true, NOW(), NOW(), '2023-01-01', '2025-12-31'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 2, 'Indovina l''Autore', 'Indovina l''autore dei libri mostrati', true, NOW(), NOW(), '2023-01-01', '2025-12-31'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 3, 'Indovina l''Anno', 'Indovina l''anno di pubblicazione del libro', true, NOW(), NOW(), '2023-01-01', '2025-12-31')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description,
    updated_at = NOW(),
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date;

-- Inserisci le impostazioni di gioco
INSERT INTO flt_game_settings (game_id, timer_duration, question_count, difficulty, active, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 30, 5, 1, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 30, 5, 1, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 30, 5, 1, true, NOW(), NOW())
ON CONFLICT (game_id) DO UPDATE 
SET timer_duration = EXCLUDED.timer_duration,
    question_count = EXCLUDED.question_count,
    difficulty = EXCLUDED.difficulty,
    updated_at = NOW();

-- Inserisci i premi di esempio
INSERT INTO flt_rewards (id, name, description, type, value, icon, color, available, image_url, is_active, rank, game_id, created_at, updated_at)
VALUES 
-- Premio per IndovinaLibro (00000000-0000-0000-0000-000000000001)
('f71f5514-70ea-4676-a125-d67cee056a9b', 'Gift Card', 'Una Giftcard da 10€', 'card', '10', 'gift', '#FF5733', 10, 'https://www.lafeltrinelli.it/images/rewards/giftcard.png', true, 1, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('6d82c2c0-9953-45d2-8ee2-b0a2c6f7a083', 'Buono sconto', 'Uno sconto del 10% sul catalogo musica', 'discount', '10', 'percent', '#33A1FF', 50, 'https://www.lafeltrinelli.it/images/rewards/buonosconto.png', true, 2, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('e0da3f4d-9589-463f-9333-3c2256528054', 'Tazza Feltrinelli', 'La nostra tazza pensata per i lettori', 'merchandise', 'tazza', 'cup', '#33FFA1', 5, 'https://www.lafeltrinelli.it/images/rewards/tazza.png', true, 3, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),

-- Premio per Indovina l'Autore (00000000-0000-0000-0000-000000000002)
(uuid_generate_v4(), 'Segnalibro Autori', 'Segnalibro con la firma degli autori', 'merchandise', 'segnalibro', 'bookmark', '#FF9933', 20, 'https://www.lafeltrinelli.it/images/rewards/segnalibro-autori.png', true, 1, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
(uuid_generate_v4(), 'Sconto Autori', 'Sconto del 15% su libri di autori selezionati', 'discount', '15', 'percent', '#33FFA1', 30, 'https://www.lafeltrinelli.it/images/rewards/sconto-autori.png', true, 2, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),

-- Premio per Indovina l'Anno (00000000-0000-0000-0000-000000000003)
(uuid_generate_v4(), 'Calendario Letterario', 'Calendario con le date di pubblicazione di grandi classici', 'merchandise', 'calendario', 'calendar', '#3399FF', 15, 'https://www.lafeltrinelli.it/images/rewards/calendario.png', true, 1, '00000000-0000-0000-0000-000000000003', NOW(), NOW()),
(uuid_generate_v4(), 'Coupon Anniversari', 'Sconto speciale sui libri che festeggiano anniversari', 'discount', '12', 'percent', '#FF3399', 25, 'https://www.lafeltrinelli.it/images/rewards/coupon-anniversari.png', true, 2, '00000000-0000-0000-0000-000000000003', NOW(), NOW())

ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    value = EXCLUDED.value,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    available = EXCLUDED.available,
    image_url = EXCLUDED.image_url,
    is_active = EXCLUDED.is_active,
    rank = EXCLUDED.rank,
    game_id = EXCLUDED.game_id,
    updated_at = NOW();

-- PARTE BADGES - gestita separatamente per risolvere i problemi di foreign key

-- Gestisci la tabella dei badge esistenti, eseguendo azioni separate e verificando lo stato
DO $$
DECLARE
    badge_exists boolean;
    badge_count integer;
BEGIN
    -- Verifica se la tabella badges esiste
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'badges'
    ) INTO badge_exists;
    
    -- Se la tabella esiste, verifica quanti badge ci sono
    IF badge_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM badges' INTO badge_count;
    ELSE
        -- Se la tabella non esiste, creala
        CREATE TABLE badges (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        badge_count := 0;
    END IF;
    
    -- Se non ci sono badge, inseriscili
    IF badge_count = 0 THEN
        INSERT INTO badges (name, description, icon, color)
        VALUES 
        ('Lettore Esperto', 'Ottenuto più di 100 punti nel quiz libri', 'book', '#FF5733'),
        ('Risposte Rapide', 'Risposto a 10 domande in meno di 5 secondi ciascuna', 'clock', '#33A1FF'),
        ('Conoscitore di Autori', 'Ottenuto il punteggio massimo nel quiz autori', 'user', '#33FFA1'),
        ('Re della Cronologia', 'Indovinato 5 anni di pubblicazione di seguito', 'calendar', '#FF33A1');
    END IF;
END
$$;

-- Crea o verifica la tabella per la relazione giochi-badge
DO $$
DECLARE
    relation_exists boolean;
BEGIN
    -- Verifica se la tabella flt_game_badges esiste
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'flt_game_badges'
    ) INTO relation_exists;
    
    -- Se la tabella non esiste, creala
    IF NOT relation_exists THEN
        CREATE TABLE flt_game_badges (
          id SERIAL PRIMARY KEY,
          game_id INTEGER NOT NULL,
          badge_id INTEGER NOT NULL REFERENCES badges(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX idx_flt_game_badges_game_id ON flt_game_badges(game_id);
        CREATE INDEX idx_flt_game_badges_badge_id ON flt_game_badges(badge_id);
    END IF;
END
$$;

-- Verifica se esistono già associazioni badge-gioco
DO $$
DECLARE
    relations_count integer;
BEGIN
    -- Conteggia le associazioni esistenti
    SELECT COUNT(*) FROM flt_game_badges INTO relations_count;
    
    -- Se non ci sono associazioni, inseriscile
    IF relations_count = 0 THEN
        -- Prima di inserire, verifica che i badge esistano effettivamente
        IF EXISTS (SELECT 1 FROM badges WHERE id = 1) AND
           EXISTS (SELECT 1 FROM badges WHERE id = 2) AND
           EXISTS (SELECT 1 FROM badges WHERE id = 3) AND
           EXISTS (SELECT 1 FROM badges WHERE id = 4) THEN
            
            INSERT INTO flt_game_badges (game_id, badge_id)
            VALUES 
            -- Badge per IndovinaLibro (ID interno: 1)
            (1, 1), -- Lettore Esperto
            (1, 2), -- Risposte Rapide
            
            -- Badge per Indovina l'Autore (ID interno: 2)
            (2, 3), -- Conoscitore di Autori
            (2, 2), -- Risposte Rapide
            
            -- Badge per Indovina l'Anno (ID interno: 3)
            (3, 4), -- Re della Cronologia
            (3, 2); -- Risposte Rapide
            
            RAISE NOTICE 'Badge-gioco associazioni inserite correttamente';
        ELSE
            RAISE WARNING 'Impossibile inserire le associazioni badge-gioco: alcuni badge non esistono';
        END IF;
    END IF;
END
$$;
