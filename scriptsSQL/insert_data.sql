-- Inserimento di esempi di badge
INSERT INTO badges (name, description, icon, color)
VALUES 
('Quiz Master', 'Rispondi correttamente a 10 domande', 'trophy', '#FFC107'),
('Lettore Esperto', 'Riconosci 5 libri diversi', 'book', '#4CAF50'),
('Risposte Rapide', 'Rispondi in meno di 5 secondi', 'clock', '#2196F3'),
('Autore del Mese', 'Indovina 3 autori di seguito', 'user', '#9C27B0')
ON CONFLICT DO NOTHING;

-- Inserimento di esempi di game_badges (associa badge ai giochi)
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

-- Inserisci esempi di rewards dalla tabella condivisa
INSERT INTO rewards (id, name, description, type, value, icon, color, available, created_at)
VALUES 
('6d82c2c0-9953-45d2-8ee2-b0a2c6f7a083', 'Buono sconto', 'Uno sconto del 10% sul catalogo musica', 'discount', '10%', 'ticket', '#E91E63', 50, NOW()),
('e0da3f4d-9589-463f-9333-3c2256528054', 'Tazza Feltrinelli', 'La nostra tazza pensata per i lettori', 'physical', 'tazza', 'coffee', '#795548', 25, NOW()),
('f71f5514-70ea-4676-a125-d67cee056a9b', 'Gift Card', 'Una Giftcard da 10€', 'giftcard', '10', 'gift', '#FF9800', 100, NOW())
ON CONFLICT DO NOTHING;
