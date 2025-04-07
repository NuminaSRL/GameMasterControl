-- Script di importazione dati per Feltrinelli Game Engine
-- ------------------------------------------------------

-- Questo script carica i dati di esempio dal database Feltrinelli
-- alle tabelle del Game Engine con il prefisso 'flt_'

-- 1. Importazione Games
INSERT INTO flt_games (id, name, description, is_active, timer_duration, question_count, weekly_leaderboard, monthly_leaderboard, reward, game_type, feltrinelli_game_id, difficulty, created_at) 
VALUES 
('1', 'IndovinaLibro', 'Indovina il libro dall'estratto dell'abstract', true, 30, 5, true, true, 'Buono sconto Feltrinelli', 'books', '00000000-0000-0000-0000-000000000001', 1, NOW()),
('2', 'Indovina l'Autore', 'Indovina l'autore dei libri mostrati', true, 30, 5, true, true, 'Tazza Feltrinelli', 'authors', '00000000-0000-0000-0000-000000000002', 1, NOW()),
('3', 'Indovina l'Anno', 'Indovina l'anno di pubblicazione dei libri mostrati', true, 30, 5, true, true, 'Gift Card Feltrinelli', 'years', '00000000-0000-0000-0000-000000000003', 2, NOW());

-- 2. Importazione Rewards
INSERT INTO flt_rewards (id, name, description, type, value, icon, color, available, created_at) 
VALUES 
('1', 'Buono sconto', 'Uno sconto del 10% sul catalogo musica', 'discount', '10%', 'ticket-percent', '#3D90D9', 10, NOW()),
('2', 'Tazza Feltrinelli', 'La nostra tazza pensata per i lettori', 'physical', 'Tazza', 'coffee', '#E84855', 5, NOW()),
('3', 'Gift Card', 'Una Giftcard da 10€', 'gift_card', '10€', 'gift', '#FCAB10', 3, NOW());

-- 3. Importazione Game Settings
INSERT INTO flt_game_settings (id, game_id, key, value, created_at) 
VALUES 
('1', '1', 'difficulty', '1', NOW()),
('2', '1', 'time_bonus', 'true', NOW()),
('3', '1', 'max_points', '100', NOW()),
('4', '2', 'difficulty', '1', NOW()),
('5', '2', 'time_bonus', 'true', NOW()),
('6', '2', 'max_points', '100', NOW()),
('7', '3', 'difficulty', '2', NOW()),
('8', '3', 'time_bonus', 'true', NOW()),
('9', '3', 'max_points', '150', NOW());

-- 4. Importazione Game Rewards
INSERT INTO flt_game_rewards (id, game_id, reward_id, position, created_at) 
VALUES 
('1', '1', '1', 1, NOW()),
('2', '2', '2', 1, NOW()),
('3', '3', '3', 1, NOW());

-- 5. Importazione Utenti di Test
INSERT INTO flt_user_profiles (id, user_id, username, avatar_url, points, created_at) 
VALUES 
('1', 'b1a4d19b-f0a1-453c-bbc1-d41b1489b7a8', 'marco', 'https://api.dicebear.com/7.x/adventurer/svg?seed=marco', 0, NOW()),
('2', '88a12f46-4948-4e0d-8c5b-023868e729ba', 'matt', 'https://api.dicebear.com/7.x/adventurer/svg?seed=matt', 0, NOW()),
('3', '06765e9b-8440-44a0-b771-090abd36713d', 'francesca', 'https://api.dicebear.com/7.x/adventurer/svg?seed=francesca', 0, NOW()),
('4', 'd2992ebc-e2da-4953-91c5-54e65d7cd00a', 'stefano', 'https://api.dicebear.com/7.x/adventurer/svg?seed=stefano', 0, NOW());

-- 6. Importazione dei Badges
INSERT INTO flt_badges (id, name, description, icon, color, created_at)
VALUES
('1', 'Lettore Esperto', 'Hai risposto correttamente a 10 domande sul quiz libri', 'book-open', '#3D90D9', NOW()),
('2', 'Bibliografo', 'Hai risposto correttamente a 10 domande sul quiz autori', 'pen-tool', '#E84855', NOW()),
('3', 'Storico', 'Hai risposto correttamente a 10 domande sul quiz anni', 'calendar', '#FCAB10', NOW()),
('4', 'Campione Quiz', 'Hai raggiunto il primo posto nella classifica generale', 'trophy', '#FFD700', NOW());

-- 7. Importazione Game Badges
INSERT INTO flt_game_badges (id, game_id, badge_id)
VALUES
('1', '1', '1'),
('2', '2', '2'),
('3', '3', '3'),
('4', '1', '4'),
('5', '2', '4'),
('6', '3', '4');

-- 8. Inserimento nella tabella Stats per avere statistiche iniziali
INSERT INTO flt_stats (id, total_games, active_games, active_users, awarded_badges, updated_at)
VALUES
('1', 3, 3, 4, 0, NOW());