# Game Manager

Un moderno pannello di controllo per la gestione di giochi basati su quiz letterari per Feltrinelli.

## Tecnologie

- Backend: Express.js, Node.js, Supabase
- Frontend: React, Vite, Tailwind CSS
- Database: Supabase (o PostgreSQL locale)
- API esterne: Feltrinelli Gaming API
- Deployment: Railway (backend), Vercel (frontend)

## Requisiti

- Node.js (versione 16 o superiore)
- npm o yarn
- PostgreSQL (se si utilizza il database locale)

## Configurazione

1. **Clona il repository**

   ```bash
   git clone https://github.com/tuo-username/game-manager.git
   cd game-manager
   ```

2. **Installa le dipendenze**

   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**

   Crea un file `.env` nella directory principale del progetto copiando il file `.env.example` e inserendo i tuoi valori:

   ```bash
   cp .env.example .env
   ```

   Modifica il file `.env` con i tuoi dati di configurazione:

   ```
   # Database configuration
   DATABASE_URL=postgres://postgres:password@localhost:5432/gamemanager

   # Supabase configuration (opzionale, solo se utilizzi Supabase)
   SUPABASE_URL=https://your-supabase-project-url.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_ANON_KEY=your-supabase-anon-key

   # Feltrinelli API configuration
   FELTRINELLI_API_URL=https://api.feltrinelli.com/v1
   ```

4. **Inizializza il database**

   Se utilizzi PostgreSQL locale, crea un database vuoto e poi esegui la migrazione:
   
   ```bash
   npm run db:push
   ```

   Se utilizzi Supabase, esegui il file `migration-script.sql` nel SQL Editor della dashboard di Supabase.

## Avvio dell'applicazione

Per avviare l'applicazione in modalità sviluppo:

```bash
npm run dev
```

L'applicazione sarà disponibile all'indirizzo `http://localhost:5000`.

## Risoluzione dei problemi

### Errore di connessione al database

Se riscontri errori di connessione al database:

1. Verifica che le variabili d'ambiente nel file `.env` siano corrette
2. Assicurati che il database sia in esecuzione e accessibile
3. Se utilizzi Supabase, verifica che la Service Role Key abbia i permessi corretti

### Errore "No storage implementation found"

Se l'applicazione mostra un errore del tipo "No storage implementation found":

1. Assicurati che le variabili d'ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY siano definite se desideri utilizzare Supabase
2. In alternativa, assicurati che DATABASE_URL sia definita per utilizzare PostgreSQL locale

### Errore nelle API Feltrinelli

Se riscontri errori nella connessione alle API Feltrinelli:

1. Verifica che la variabile d'ambiente FELTRINELLI_API_URL sia corretta
2. Controlla che l'endpoint API sia accessibile dalla tua rete

## Struttura del progetto

- `/client`: Codice frontend in React
  - `/src`: Sorgenti React
    - `/components`: Componenti UI riutilizzabili
    - `/pages`: Pagine dell'applicazione
    - `/lib`: Utility e configurazioni
- `/server`: Codice backend in Express
  - `routes.ts`: Definizione degli endpoint API
  - `storage.ts`: Interfaccia di storage e implementazioni
  - `supabase-storage.ts`: Implementazione storage con Supabase
- `/shared`: Codice condiviso tra frontend e backend
  - `schema.ts`: Definizione dello schema del database con Drizzle