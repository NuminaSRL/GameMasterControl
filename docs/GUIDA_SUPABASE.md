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

#### Opzione A: Utilizzando l'SQL Editor di Supabase (consigliato)

1. Accedi al pannello di controllo di Supabase
2. Vai alla sezione "SQL Editor"
3. Crea una nuova query
4. Copia e incolla il contenuto del file `update_tables.sql` per aggiornare le tabelle esistenti
5. Esegui la query per creare/aggiornare tutte le tabelle necessarie

#### Opzione B: Esecuzione manuale dell'SQL per creare o aggiornare le tabelle

Esegui le seguenti query per aggiornare la struttura delle tabelle con i nuovi campi:

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

-- Crea o aggiorna la tabella dei premi
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
  rank INTEGER DEFAULT 0
);

-- Crea o aggiorna indici
CREATE INDEX IF NOT EXISTS idx_flt_rewards_is_active ON flt_rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_flt_games_start_end_date ON flt_games(start_date, end_date);
```

### 3. Inserimento di Dati Iniziali

Se è la prima volta che configuri il database, puoi utilizzare i seguenti file SQL per popolare le tabelle con dati iniziali:

```sql
-- Inserisci i giochi di base
INSERT INTO flt_games (id, feltrinelli_id, internal_id, name, description, is_active, created_at, updated_at, start_date, end_date)
VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 1, 'IndovinaLibro', 'Indovina il libro dall'estratto dell'abstract', true, NOW(), NOW(), '2023-01-01', '2025-12-31'),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 2, 'Indovina l'Autore', 'Indovina l'autore dei libri mostrati', true, NOW(), NOW(), '2023-01-01', '2025-12-31'),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 3, 'Indovina l'Anno', 'Indovina l'anno di pubblicazione del libro', true, NOW(), NOW(), '2023-01-01', '2025-12-31')
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, 
    description = EXCLUDED.description,
    updated_at = NOW();

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
INSERT INTO flt_rewards (name, description, type, value, icon, color, available, image_url, is_active, rank, created_at, updated_at)
VALUES 
('Gift Card', 'Una Giftcard da 10€', 'card', '10', 'gift', '#FF5733', 10, 'https://www.lafeltrinelli.it/images/rewards/giftcard.png', true, 1, NOW(), NOW()),
('Buono sconto', 'Uno sconto del 10% sul catalogo musica', 'discount', '10', 'percent', '#33A1FF', 50, 'https://www.lafeltrinelli.it/images/rewards/buonosconto.png', true, 2, NOW(), NOW()),
('Tazza Feltrinelli', 'La nostra tazza pensata per i lettori', 'merchandise', 'tazza', 'cup', '#33FFA1', 5, 'https://www.lafeltrinelli.it/images/rewards/tazza.png', true, 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
```

### 4. Configurazione del Provider di Storage

Il sistema è già impostato per utilizzare Supabase di default. Se desideri modificare esplicitamente il provider di storage, modifica il file `server/storage-provider.ts`:

```typescript
// Imposta Supabase come provider predefinito
StorageProviderManager.setProvider(StorageProvider.SUPABASE);

// Oppure imposta Drizzle per lo sviluppo locale
// StorageProviderManager.setProvider(StorageProvider.DRIZZLE);
```

### 5. Verifica della Configurazione

Per verificare che la configurazione sia corretta, esegui i seguenti test:

1. Accedi all'endpoint di health check: `GET /api/health`
2. Verifica l'accesso ai giochi: `GET /api/feltrinelli/games`
3. Verifica l'accesso ai premi: `GET /api/feltrinelli/rewards?gameType=books`

## Corrispondenza tra Schema Drizzle e Tabelle Supabase

È importante assicurarsi che la struttura delle tabelle in Supabase corrisponda esattamente a quella definita negli schemi Drizzle. Ecco la corrispondenza tra le definizioni Drizzle e le tabelle Supabase:

### 1. Tabella `flt_games`

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

### 2. Tabella `flt_game_settings`

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

### 3. Tabella `flt_rewards`

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
  rank: integer('rank').default(0)
});
```

## Note Importanti

- Assicurati che le variabili d'ambiente siano correttamente configurate prima di avviare l'applicazione
- Per il deployment in produzione, è consigliabile utilizzare Supabase come provider
- I nomi delle tabelle in Supabase sono case-sensitive, assicurati di utilizzare la stessa nomenclatura presente nello schema (in generale, tutte le tabelle utilizzano lowercase e underscore)
- I giochi predefiniti hanno gli UUID: 
  - IndovinaLibro: `00000000-0000-0000-0000-000000000001`
  - Indovina l'Autore: `00000000-0000-0000-0000-000000000002`
  - Indovina l'Anno: `00000000-0000-0000-0000-000000000003`

## Troubleshooting

Se riscontri problemi con la connessione a Supabase:

1. Verifica che le credenziali in `.env` siano corrette
2. Assicurati che il progetto Supabase sia attivo
3. Controlla che l'indirizzo IP del tuo server non sia bloccato dalle regole firewall di Supabase
4. Verifica che le tabelle esistano nel database con i nomi corretti
5. Controlla i log del server per errori specifici di connessione
6. Verifica che i tipi di colonna in Supabase corrispondano a quelli definiti nello schema Drizzle
7. Assicurati che le estensioni necessarie (come "uuid-ossp") siano abilitate

## Modifiche alla Configurazione per il Deployment

Quando esegui il deployment dell'applicazione, assicurati di:

1. Configurare le variabili d'ambiente nel provider di hosting
2. Verificare che Supabase sia impostato come provider di storage predefinito
3. Testare tutti gli endpoint API per assicurarti che funzionino correttamente
4. Riavviare l'applicazione dopo aver modificato la configurazione
