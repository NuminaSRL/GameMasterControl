-- Crea un profilo utente di test
INSERT INTO user_profiles (id, user_id, created_at)
VALUES 
('test-user-id', 'test-user-id', NOW())
ON CONFLICT (id) DO NOTHING;
