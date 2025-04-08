-- Script corretto per inserire le associazioni tra giochi e badge
-- Direttamente nella tabella flt_game_badges esistente

-- Prima verifichiamo gli ID dei badge esistenti nella tabella che viene realmente usata dall'applicazione
SELECT * FROM badges;

-- Verifichiamo la struttura della tabella flt_game_badges per capire quali campi dobbiamo valorizzare
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'flt_game_badges';

-- Modifichiamo l'inserimento adattandoci alla struttura realmente esistente
-- Assumiamo che i badge abbiano ID 9, 10, 11, 12 come visto dai log
INSERT INTO flt_game_badges (game_id, badge_id)
VALUES 
-- Badge per IndovinaLibro (ID interno: 1)
(1, 9), -- Lettore Esperto (ID: 9)
(1, 10), -- Risposte Rapide (ID: 10)

-- Badge per Indovina l'Autore (ID interno: 2)
(2, 11), -- Conoscitore di Autori (ID: 11)
(2, 10), -- Risposte Rapide (ID: 10)

-- Badge per Indovina l'Anno (ID interno: 3)
(3, 12), -- Re della Cronologia (ID: 12)
(3, 10); -- Risposte Rapide (ID: 10)

-- Conferma l'inserimento
SELECT * FROM flt_game_badges;
