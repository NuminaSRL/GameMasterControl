-- Controlla se la colonna esiste già prima di aggiungerla
DO $$ 
BEGIN 
    -- Rimuovi constraint FK se esistente per modificare la tabella
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'flt_user_rewards_reward_id_fkey'
    ) THEN
        ALTER TABLE flt_user_rewards DROP CONSTRAINT flt_user_rewards_reward_id_fkey;
    END IF;

    -- Controlla se la colonna esiste già
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rewards' AND column_name = 'game_type'
    ) THEN
        ALTER TABLE rewards ADD COLUMN game_type TEXT DEFAULT 'books';
    END IF;

    -- Ricrea il constraint FK
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'flt_user_rewards_reward_id_fkey'
    ) THEN
        ALTER TABLE flt_user_rewards 
        ADD CONSTRAINT flt_user_rewards_reward_id_fkey 
        FOREIGN KEY (reward_id) REFERENCES rewards(id);
    END IF;
END $$;
