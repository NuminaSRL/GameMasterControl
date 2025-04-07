-- Script per inserire manualmente le associazioni tra giochi e badge
-- Da utilizzare quando la tabella flt_game_badges è vuota

-- Prima visualizza i badge esistenti per confermare i loro ID
SELECT * FROM badges;

-- Inserisci manualmente le associazioni badge-gioco
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

-- Conferma l'inserimento
SELECT * FROM flt_game_badges;
