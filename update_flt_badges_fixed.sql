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

-- Verifica se la tabella per la relazione giochi-badge esiste
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flt_game_badges') THEN
        -- Crea la tabella se non esiste
        CREATE TABLE flt_game_badges (
          id SERIAL PRIMARY KEY,
          game_id INTEGER NOT NULL,
          badge_id INTEGER NOT NULL REFERENCES badges(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Crea indici per migliorare le performance delle query
        CREATE INDEX idx_flt_game_badges_game_id ON flt_game_badges(game_id);
        CREATE INDEX idx_flt_game_badges_badge_id ON flt_game_badges(badge_id);
    END IF;
END
$$;

-- Inserisci le associazioni badge-gioco convertendo gli UUID in ID interi
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
(3, 2)  -- Risposte Rapide

ON CONFLICT DO NOTHING;
