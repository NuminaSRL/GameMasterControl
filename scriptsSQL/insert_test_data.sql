-- Inserisci un profilo di test
INSERT INTO flt_user_profiles (id, user_id, username, avatar_url)
VALUES 
('test-user-id', 'test-user-id', 'TestUser', 'https://www.gravatar.com/avatar/test')
ON CONFLICT (id) DO NOTHING;
