-- Crea la tabella dei profili utente se non esiste
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci un profilo utente di test
INSERT INTO user_profiles (user_id, username, email, avatar_url)
VALUES 
('test-user-id', 'TestUser', 'test@example.com', 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y')
ON CONFLICT DO NOTHING;
