# Guida alla Configurazione di Supabase

## Panoramica

Questa guida ti aiuterà a configurare Supabase per la tua istanza del Gaming Engine. Il sistema è progettato per funzionare sia con Drizzle ORM (database locale) che con Supabase (database cloud), e può passare facilmente da uno all'altro attraverso il pattern di astrazione implementato.

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
```

### 2. Impostazione delle Tabelle in Supabase

Puoi creare le tabelle necessarie in Supabase in due modi:

#### Opzione A: Utilizzando l'SQL Editor di Supabase

1. Accedi al pannello di controllo di Supabase
2. Vai alla sezione "SQL Editor"
3. Crea una nuova query
4. Copia e incolla il contenuto del file `feltrinelli_data_import.sql` 
5. Esegui la query per creare tutte le tabelle necessarie

#### Opzione B: Esecuzione degli Script di Migrazione

Esegui il seguente comando nel terminale per applicare la migrazione:

```bash
npm run db:push
```

### 3. Configurazione del Provider di Storage

Per utilizzare Supabase come provider di dati predefinito, assicurati che nell'applicazione sia impostato Supabase come provider predefinito. Questo è già configurato in `server/storage-provider.ts`:

```typescript
// Imposta il provider di storage predefinito (puoi modificarlo qui)
StorageProviderManager.setProvider(StorageProvider.SUPABASE);
```

Se desideri passare a Drizzle, modifica la riga precedente in:

```typescript
StorageProviderManager.setProvider(StorageProvider.DRIZZLE);
```

### 4. Importazione dei Dati Iniziali

Per importare i dati iniziali in Supabase, puoi eseguire il seguente endpoint:

```
POST /api/feltrinelli/import-initial-data
```

Questo endpoint inizializzerà le tabelle di base con i dati necessari per il funzionamento dell'applicazione, includendo:

- Giochi predefiniti (IndovinaLibro, Indovina l'Autore, Indovina l'Anno)
- Impostazioni dei giochi
- Premi base

### 5. Verifica della Configurazione

Per verificare che la configurazione sia corretta, esegui i seguenti test:

1. Accedi all'endpoint di health check: `GET /api/health`
2. Verifica l'accesso ai giochi: `GET /api/feltrinelli/games`
3. Controlla l'accesso alle impostazioni: `GET /api/feltrinelli/game-settings/00000000-0000-0000-0000-000000000001`

Se tutte queste richieste restituiscono dati corretti, la configurazione è completata con successo.

## Passaggio Da Drizzle a Supabase e Viceversa

Il sistema utilizza un pattern di astrazione che permette di passare facilmente da un provider di storage all'altro. Questo è gestito dalla classe `StorageProviderManager` in `server/storage-provider.ts`.

### Per passare a Supabase:

```typescript
StorageProviderManager.setProvider(StorageProvider.SUPABASE);
```

### Per passare a Drizzle:

```typescript
StorageProviderManager.setProvider(StorageProvider.DRIZZLE);
```

Puoi fare questa modifica nel file `server/storage-provider.ts` oppure creare un endpoint di configurazione che permetta di cambiare il provider a runtime.

## API Helper Funzioni

Il sistema fornisce diverse funzioni helper per interagire con il database, indipendentemente dal provider selezionato:

- `executeQuery<T>`: Esegue una query generica
- `selectFromTable<T>`: Esegue una query SELECT
- `insertIntoTable<T>`: Inserisce dati in una tabella
- `updateTable<T>`: Aggiorna dati in una tabella
- `deleteFromTable`: Elimina dati da una tabella

Queste funzioni gestiscono automaticamente la differenza tra Drizzle e Supabase, permettendoti di scrivere codice una volta sola che funziona con entrambi i provider.

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

Se l'applicazione funziona con Drizzle ma non con Supabase, il problema potrebbe essere legato alla struttura delle tabelle o ai permessi in Supabase.