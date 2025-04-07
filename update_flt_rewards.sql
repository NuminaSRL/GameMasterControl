-- Abilita l'estensione UUID se non è già attiva
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Aggiorna la tabella dei premi con i nuovi campi necessari
ALTER TABLE flt_rewards
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS points_required INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Inserisci i premi predefiniti con il campo game_id (associati a tutti i giochi)
INSERT INTO flt_rewards (id, name, description, type, value, icon, color, available, image_url, is_active, rank, game_id, created_at, updated_at)
VALUES 
-- Premio per IndovinaLibro (00000000-0000-0000-0000-000000000001)
('f71f5514-70ea-4676-a125-d67cee056a9b', 'Gift Card', 'Una Giftcard da 10€', 'card', '10', 'gift', '#FF5733', 10, 'https://www.lafeltrinelli.it/images/rewards/giftcard.png', true, 1, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('6d82c2c0-9953-45d2-8ee2-b0a2c6f7a083', 'Buono sconto', 'Uno sconto del 10% sul catalogo musica', 'discount', '10', 'percent', '#33A1FF', 50, 'https://www.lafeltrinelli.it/images/rewards/buonosconto.png', true, 2, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('e0da3f4d-9589-463f-9333-3c2256528054', 'Tazza Feltrinelli', 'La nostra tazza pensata per i lettori', 'merchandise', 'tazza', 'cup', '#33FFA1', 5, 'https://www.lafeltrinelli.it/images/rewards/tazza.png', true, 3, '00000000-0000-0000-0000-000000000001', NOW(), NOW()),

-- Premio per Indovina l'Autore (00000000-0000-0000-0000-000000000002)
(uuid_generate_v4(), 'Segnalibro Autori', 'Segnalibro con la firma degli autori', 'merchandise', 'segnalibro', 'bookmark', '#FF9933', 20, 'https://www.lafeltrinelli.it/images/rewards/segnalibro-autori.png', true, 1, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),
(uuid_generate_v4(), 'Sconto Autori', 'Sconto del 15% su libri di autori selezionati', 'discount', '15', 'percent', '#33FFA1', 30, 'https://www.lafeltrinelli.it/images/rewards/sconto-autori.png', true, 2, '00000000-0000-0000-0000-000000000002', NOW(), NOW()),

-- Premio per Indovina l'Anno (00000000-0000-0000-0000-000000000003)
(uuid_generate_v4(), 'Calendario Letterario', 'Calendario con le date di pubblicazione di grandi classici', 'merchandise', 'calendario', 'calendar', '#3399FF', 15, 'https://www.lafeltrinelli.it/images/rewards/calendario.png', true, 1, '00000000-0000-0000-0000-000000000003', NOW(), NOW()),
(uuid_generate_v4(), 'Coupon Anniversari', 'Sconto speciale sui libri che festeggiano anniversari', 'discount', '12', 'percent', '#FF3399', 25, 'https://www.lafeltrinelli.it/images/rewards/coupon-anniversari.png', true, 2, '00000000-0000-0000-0000-000000000003', NOW(), NOW())

ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    value = EXCLUDED.value,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    available = EXCLUDED.available,
    image_url = EXCLUDED.image_url,
    is_active = EXCLUDED.is_active,
    rank = EXCLUDED.rank,
    game_id = EXCLUDED.game_id,
    updated_at = NOW();
