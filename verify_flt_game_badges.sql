-- Script per verificare le associazioni esistenti e aggiungere solo quelle mancanti

-- Visualizza le associazioni badge-gioco esistenti
SELECT gb.*, b.name AS badge_name, g.name AS game_name
FROM flt_game_badges gb
JOIN badges b ON gb.badge_id = b.id
JOIN flt_games g ON gb.game_id = g.internal_id
ORDER BY g.internal_id, b.id;

-- Esegui questa parte solo se hai bisogno di aggiungere nuove associazioni
-- (dopo aver verificato quali associazioni mancano)

-- Esempio di inserimento condizionale da adattare in base ai risultati della query precedente
-- (decommentare e modificare gli ID in base alle associazioni mancanti)

/*
DO $$
BEGIN
    -- Verifica e inserisci solo se l'associazione non esiste già
    IF NOT EXISTS (SELECT 1 FROM flt_game_badges WHERE game_id = 2 AND badge_id = 11) THEN
        INSERT INTO flt_game_badges (game_id, badge_id) VALUES (2, 11);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM flt_game_badges WHERE game_id = 3 AND badge_id = 12) THEN
        INSERT INTO flt_game_badges (game_id, badge_id) VALUES (3, 12);
    END IF;
END
$$;
*/
