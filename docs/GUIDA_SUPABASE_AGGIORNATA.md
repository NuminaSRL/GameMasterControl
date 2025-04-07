# Guida alla Configurazione di Supabase (Aggiornata)

## Panoramica

Questa guida aggiornata ti aiuterà a configurare Supabase per la tua istanza del Gaming Engine. Il sistema è progettato per funzionare sia con Drizzle ORM (database locale) che con Supabase (database cloud), e può passare facilmente da uno all'altro attraverso il pattern di astrazione implementato.

## Pre-requisiti

1. Un account Supabase (https://supabase.io)
2. Un progetto Supabase creato
3. Le credenziali del tuo progetto Supabase:
   - URL Supabase
   - Chiave anonima (Anon Key)
   - Chiave di servizio (Service Role Key)

## Passaggi per la Configurazione

### 1. Configurazione delle Variabili d'Ambiente

Crea un file `.env` nella radice del progetto (o aggiorna quello esistente) con le seguenti variabili:

```
SUPABASE_URL=https://tuo-progetto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (la tua chiave anonima)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (la tua chiave di servizio)
FELTRINELLI_API_URL=https://url-api-feltrinelli.it (opzionale per integrazione diretta)
```

### 2. Impostazione delle Tabelle in Supabase

Puoi creare o aggiornare le tabelle necessarie in Supabase in due modi:

#### Opzione A: Utilizzo del file aggiornato completo (consigliato)

1. Accedi al pannello di controllo di Supabase
2. Vai alla sezione "SQL Editor"
3. Crea una nuova query
4. Copia e incolla il contenuto del file `update_all_tables.sql` per aggiornare contemporaneamente tutte le tabelle
5. Esegui la query per creare/aggiornare le tabelle e popolarle con i dati di esempio

#### Opzione B: Aggiornamento per componenti specifici

Se preferisci aggiornare solo componenti specifici del database, puoi utilizzare gli script dedicati:

**Per aggiornare solo i premi**:
1. Utilizza il file `update_flt_rewards.sql`
2. Questo aggiornerà la tabella `flt_rewards` con il campo `game_id` e aggiungerà premi per ciascun gioco

**Per aggiornare solo i badge**:
1. Utilizza il file `update_flt_badges.sql`
2. Questo creerà i badge e le associazioni con i giochi tramite la tabella `flt_game_badges`

### 3. Schema SQL completo

Di seguito è riportato il contenuto dello script SQL completo (`update_all_tables.sql`) che aggiorna tutte le tabelle necessarie:

```sql
-- Abilita l'estensione UUID se non è già attiva
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Aggiorna la tabella dei giochi con i campi data inizio e fine
ALTER TABLE flt_games
ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Aggiorna le impostazioni di gioco con il campo difficoltà
ALTER TABLE flt_game_settings
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1;

-- Aggiorna o crea la tabella dei premi
CREATE TABLE IF NOT EXISTS flt_rewards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(100),
  value VARCHAR(255),
  icon VARCHAR(255),
  color VARCHAR(50),
  available INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  rank INTEGER DEFAULT 0,
  game_id UUID REFERENCES flt_games(id)
);

-- Crea o aggiorna indici
CREATE INDEX IF NOT EXISTS idx_flt_rewards_is_active ON flt_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_flt_games_start_end_date ON flt_games(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_flt_rewards_game_id ON flt_rewards(game_id);

-- Inserisci i giochi di base (se non esistono)
INSERT INTO flt_games (id, feltrinelli_id, internal_id, name, description, is_active, created_at, updated_at, start_date, end_date)
VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'IndovinaLibro', 'Indovina il libro dall''estratto dell''abstract', true, NOW(), NOW(), '2023-01-01', '2025-12-31'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 2, 'Indovina l''Autore', 'Indovina l''autore dei libri mostrati', true, NOW(), NOW(), '2023-01-01', '2025-12-31'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 3, 'Indovina l''Anno', 'Indovina l''anno di pubblicazione del libro', true, NOW(), NOW(), '2023-01-01', '2025-12-31')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description,
    updated_at = NOW(),
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date;

-- Inserisci le impostazioni di gioco
INSERT INTO flt_game_settings (game_id, timer_duration, question_count, difficulty, active, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 30, 5, 1, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 30, 5, 1, true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000003', 30, 5, 1, true, NOW(), NOW())
ON CONFLICT (game_id) DO UPDATE 
SET timer_duration = EXCLUDED.timer_duration,
    question_count = EXCLUDED.question_count,
    difficulty = EXCLUDED.difficulty,
    updated_at = NOW();

-- Inserisci i premi di esempio
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

-- Crea e popola la tabella dei badge se non esiste
CREATE TABLE IF NOT EXISTS badges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL,
  color VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci i badge di base
INSERT INTO badges (name, description, icon, color)
VALUES 
('Lettore Esperto', 'Ottenuto più di 100 punti nel quiz libri', 'book', '#FF5733'),
('Risposte Rapide', 'Risposto a 10 domande in meno di 5 secondi ciascuna', 'clock', '#33A1FF'),
('Conoscitore di Autori', 'Ottenuto il punteggio massimo nel quiz autori', 'user', '#33FFA1'),
('Re della Cronologia', 'Indovinato 5 anni di pubblicazione di seguito', 'calendar', '#FF33A1')
ON CONFLICT DO NOTHING;

-- Assicurati che la tabella per la relazione giochi-badge esista
CREATE TABLE IF NOT EXISTS flt_game_badges (
  id SERIAL PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES flt_games(id),
  badge_id INTEGER NOT NULL REFERENCES badges(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crea indice per migliorare le performance delle query
CREATE INDEX IF NOT EXISTS idx_flt_game_badges_game_id ON flt_game_badges(game_id);
CREATE INDEX IF NOT EXISTS idx_flt_game_badges_badge_id ON flt_game_badges(badge_id);

-- Inserisci le associazioni badge-gioco
INSERT INTO flt_game_badges (game_id, badge_id)
VALUES 
-- Badge per IndovinaLibro (00000000-0000-0000-0000-000000000001)
('00000000-0000-0000-0000-000000000001', 1), -- Lettore Esperto
('00000000-0000-0000-0000-000000000001', 2), -- Risposte Rapide

-- Badge per Indovina l'Autore (00000000-0000-0000-0000-000000000002)
('00000000-0000-0000-0000-000000000002', 3), -- Conoscitore di Autori
('00000000-0000-0000-0000-000000000002', 2), -- Risposte Rapide

-- Badge per Indovina l'Anno (00000000-0000-0000-0000-000000000003)
('00000000-0000-0000-0000-000000000003', 4), -- Re della Cronologia
('00000000-0000-0000-0000-000000000003', 2)  -- Risposte Rapide

ON CONFLICT DO NOTHING;
```

### 4. Corrispondenza tra Schema Drizzle e Tabelle Supabase

È importante assicurarsi che la struttura delle tabelle in Supabase corrisponda esattamente a quella definita negli schemi Drizzle. Ecco la corrispondenza tra le definizioni Drizzle e le tabelle Supabase:

#### 1. Tabella `flt_games` (aggiornata)

```typescript
// Schema Drizzle
export const fltGames = pgTable('flt_games', {
  id: uuid('id').primaryKey().defaultRandom(),
  feltrinelli_id: uuid('feltrinelli_id'),
  internal_id: integer('internal_id'),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  is_active: boolean('is_active').default(true),
  start_date: timestamp('start_date', { withTimezone: true }),
  end_date: timestamp('end_date', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
```

#### 2. Tabella `flt_game_settings` (aggiornata)

```typescript
// Schema Drizzle
export const fltGameSettings = pgTable('flt_game_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  game_id: uuid('game_id').references(() => fltGames.id),
  timer_duration: integer('timer_duration').default(30),
  question_count: integer('question_count').default(5),
  difficulty: integer('difficulty').default(1),
  active: boolean('active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});
```

#### 3. Tabella `flt_rewards` (aggiornata)

```typescript
// Schema Drizzle
export const fltRewards = pgTable('flt_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 100 }),
  value: varchar('value', { length: 255 }),
  icon: varchar('icon', { length: 255 }),
  color: varchar('color', { length: 50 }),
  available: integer('available').default(0),
  image_url: text('image_url'),
  is_active: boolean('is_active').default(true),
  start_date: timestamp('start_date', { withTimezone: true }),
  end_date: timestamp('end_date', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  rank: integer('rank').default(0),
  game_id: uuid('game_id').references(() => fltGames.id)
});
```

#### 4. Tabella `badges` e `flt_game_badges` (nuove)

```typescript
// Schema Drizzle per Badge
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Schema Drizzle per relazione Game-Badge
export const gameBadges = pgTable("flt_game_badges", {
  id: serial("id").primaryKey(),
  game_id: uuid("game_id").notNull().references(() => fltGames.id),
  badge_id: integer("badge_id").notNull().references(() => badges.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
```

### 5. Verifica della Configurazione

Per verificare che la configurazione sia corretta, esegui i seguenti test:

1. Accedi all'endpoint di health check: `GET /api/health`
2. Verifica l'accesso ai giochi: `GET /api/feltrinelli/games`
3. Verifica l'accesso ai premi: `GET /api/feltrinelli/rewards?gameType=books`
4. Verifica l'accesso ai badge: `GET /api/feltrinelli/game-badges/00000000-0000-0000-0000-000000000001`

Se tutti questi endpoint restituiscono dati corretti, la configurazione è completa.

## Note Importanti

- Assicurati che le variabili d'ambiente siano correttamente configurate prima di avviare l'applicazione
- I premi sono ora associati ai giochi specifici tramite il campo `game_id`
- I badge sono associati ai giochi tramite la tabella di relazione `flt_game_badges`
- I giochi hanno ora date di inizio e fine per definire il periodo di attivazione
- Le impostazioni dei giochi includono ora il livello di difficoltà

## Troubleshooting

Se riscontri problemi con la connessione a Supabase o con l'esecuzione degli script SQL:

1. Verifica che le credenziali in `.env` siano corrette
2. Assicurati che il progetto Supabase sia attivo
3. Controlla che i tipi di dati nelle colonne corrispondano a quelli definiti negli schemi Drizzle
4. Assicurati che l'estensione "uuid-ossp" sia abilitata nel tuo progetto Supabase
5. Se hai problemi con le chiavi esterne, potrebbe essere necessario creare prima le tabelle referenziate

In caso di problemi specifici con i tipi di dati UUID, assicurati che Supabase stia utilizzando il tipo corretto. In alcuni casi potrebbe essere necessario modificare i tipi di dati manualmente tramite l'interfaccia di Supabase.

## Ulteriori Strumenti per la Gestione del Database

Se preferisci un'interfaccia grafica per gestire il database, Supabase offre una dashboard completa che include:

1. Table Editor: per visualizzare e modificare i dati
2. SQL Editor: per eseguire query SQL personalizzate
3. Database Schema: per visualizzare e modificare la struttura del database

Questi strumenti possono essere utili per verificare che gli script SQL siano stati eseguiti correttamente e che i dati siano stati inseriti come previsto.
