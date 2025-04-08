-- Inserimento di esempi di badge
INSERT INTO badges (name, description, icon, color)
VALUES 
('Quiz Master', 'Rispondi correttamente a 10 domande', 'trophy', '#FFC107'),
('Lettore Esperto', 'Riconosci 5 libri diversi', 'book', '#4CAF50'),
('Risposte Rapide', 'Rispondi in meno di 5 secondi', 'clock', '#2196F3'),
('Autore del Mese', 'Indovina 3 autori di seguito', 'user', '#9C27B0')
ON CONFLICT DO NOTHING;

-- Verifica e inserisci games se non esistono
INSERT INTO games (id, name, description, is_active, timer_duration, question_count, reward, difficulty)
VALUES 
(1, 'Quiz Libri', 'Indovina il libro dalla descrizione', true, 30, 10, 'Badge Quiz Master', 2),
(2, 'Quiz Autori', 'Associa l''autore all''opera', true, 30, 10, 'Badge Esperto', 2),
(3, 'Quiz Anni', 'Indovina l''anno di pubblicazione', true, 30, 10, 'Badge Storico', 3)
ON CONFLICT (id) DO NOTHING;

-- Ora che abbiamo i games, inseriamo le associazioni badge-gioco
INSERT INTO game_badges (game_id, badge_id)
SELECT 1, id FROM badges WHERE name = 'Quiz Master'
ON CONFLICT DO NOTHING;

INSERT INTO game_badges (game_id, badge_id)
SELECT 1, id FROM badges WHERE name = 'Lettore Esperto'
ON CONFLICT DO NOTHING;

INSERT INTO game_badges (game_id, badge_id)
SELECT 2, id FROM badges WHERE name = 'Autore del Mese'
ON CONFLICT DO NOTHING;

INSERT INTO game_badges (game_id, badge_id)
SELECT 2, id FROM badges WHERE name = 'Risposte Rapide'
ON CONFLICT DO NOTHING;

-- Verifica la struttura della tabella rewards
\d rewards;

-- Inserisci esempi di rewards adattando alla struttura corretta della tabella
-- (Qui adattare in base alla struttura attuale dei campi in tabella)
-- Inserisci esempi di rewards adattati alla struttura della tabella
INSERT INTO rewards (name, description, type, value, icon, color, available, rank, image_url, game_type)
VALUES 
('Buono sconto', 'Uno sconto del 10% sul catalogo musica', 'discount', '10%', 'ticket', '#E91E63', 50, 1, 'https://www.lafeltrinelli.it/images/rewards/buonosconto.png', 'books'),
('Tazza Feltrinelli', 'La nostra tazza pensata per i lettori', 'physical', 'tazza', 'coffee', '#795548', 25, 2, 'https://www.lafeltrinelli.it/images/rewards/tazza.png', 'authors'),
('Gift Card', 'Una Giftcard da 10€', 'giftcard', '10', 'gift', '#FF9800', 100, 3, 'https://www.lafeltrinelli.it/images/rewards/giftcard.png', 'years')
ON CONFLICT DO NOTHING;
