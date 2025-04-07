-- Abilita l'estensione UUID se non è già attiva
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Crea e popola la tabella dei badge se non esiste
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci i badge di base
INSERT INTO badges (name, description, icon, color)
VALUES 
('Lettore Esperto', 'Ottenuto più di 100 punti nel quiz libri', 'book', '#FF5733'),
('Risposte Rapide', 'Risposto a 10 domande in meno di 5 secondi ciascuna', 'clock', '#33A1FF'),
('Conoscitore di Autori', 'Ottenuto il punteggio massimo nel quiz autori', 'user', '#33FFA1'),
('Re della Cronologia', 'Indovinato 5 anni di pubblicazione di seguito', 'calendar', '#FF33A1')
ON CONFLICT DO NOTHING;

-- Assicurati che la tabella per la relazione giochi-badge esista
CREATE TABLE IF NOT EXISTS flt_game_badges (
  id SERIAL PRIMARY KEY,
  game_id UUID NOT NULL,
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_flt_game_badges_game_id ON flt_game_badges(game_id);
CREATE INDEX IF NOT EXISTS idx_flt_game_badges_badge_id ON flt_game_badges(badge_id);

-- Inserisci le associazioni badge-gioco
INSERT INTO flt_game_badges (game_id, badge_id)
VALUES 
-- Badge per IndovinaLibro (00000000-0000-0000-0000-000000000001)
('00000000-0000-0000-0000-000000000001', 1), -- Lettore Esperto
('00000000-0000-0000-0000-000000000001', 2), -- Risposte Rapide

-- Badge per Indovina l'Autore (00000000-0000-0000-0000-000000000002)
('00000000-0000-0000-0000-000000000002', 3), -- Conoscitore di Autori
('00000000-0000-0000-0000-000000000002', 2), -- Risposte Rapide

-- Badge per Indovina l'Anno (00000000-0000-0000-0000-000000000003)
('00000000-0000-0000-0000-000000000003', 4), -- Re della Cronologia
('00000000-0000-0000-0000-000000000003', 2)  -- Risposte Rapide

ON CONFLICT DO NOTHING;
