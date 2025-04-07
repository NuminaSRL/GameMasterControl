# Istruzioni per il Deployment

Questo documento fornisce istruzioni dettagliate per il deployment dell'applicazione Game Manager sia in un ambiente di sviluppo locale che su servizi di hosting.

## Deployment su Railway & Vercel (Raccomandato)

### 1. Preparazione del deployment su Railway (Backend)

1. **Crea un account Railway** su [railway.app](https://railway.app) se non ne hai già uno

2. **Crea un nuovo progetto**:
   - Seleziona "Deploy from GitHub repo"
   - Collega il tuo repository GitHub
   - Seleziona la branch `main`
   
3. **Configura le variabili d'ambiente**:
   - Vai nella sezione "Variables"
   - Clicca "New Variable" e aggiungi tutte le variabili d'ambiente necessarie:
     ```
     SUPABASE_URL=
     SUPABASE_SERVICE_ROLE_KEY=
     SUPABASE_ANON_KEY=
     FELTRINELLI_API_URL=
     ```
   - Se necessario, aggiungi anche:
     ```
     DATABASE_URL=
     PGHOST=
     PGUSER=
     PGPASSWORD=
     PGPORT=
     PGDATABASE=
     ```
     
4. **Configura il deployment**:
   - Railway dovrebbe rilevare automaticamente il file `Procfile` e utilizzare il comando corretto `npm run start`
   - Assicurati che l'opzione "Watch" sia abilitata per ricostruire l'app quando viene fatto il push di nuovi commit
   
5. **Configura il dominio personalizzato** (opzionale):
   - Nella sezione "Settings > Domains"
   - Clicca "Generate Domain" per ottenere un dominio railway.app o configura un dominio personalizzato

### 2. Preparazione del deployment su Vercel (Frontend)

1. **Crea un account Vercel** su [vercel.com](https://vercel.com) se non ne hai già uno

2. **Importa il progetto**:
   - Collega il tuo repository GitHub
   - Nella configurazione del deployment, fornisci i seguenti dettagli:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Configura le variabili d'ambiente**:
   - Aggiungi la variabile `VITE_API_URL` che punta all'URL del backend di Railway:
     ```
     VITE_API_URL=https://tuo-backend-railway.up.railway.app/api
     ```
     
4. **Aggiorna il file `vercel.json`**:
   - Assicurati che il file `vercel.json` sia configurato per reindirizzare correttamente le chiamate API al backend:
     ```json
     {
       "buildCommand": "npm run build",
       "outputDirectory": "dist",
       "framework": "vite",
       "rewrites": [
         {
           "source": "/api/:path*",
           "destination": "https://tuo-backend-railway.up.railway.app/api/:path*"
         },
         {
           "source": "/(.*)",
           "destination": "/index.html"
         }
       ]
     }
     ```

5. **Avvia il deployment**:
   - Clicca su "Deploy" per avviare il processo di build e deployment

### 3. Connessione tra Frontend e Backend

Dopo il deployment:

1. **Aggiorna il file backend `server/index.ts`**:
   - Nella configurazione CORS, aggiungi il dominio Vercel ai domini consentiti:
     ```javascript
     const allowedOrigins = [
       'https://tuo-frontend-vercel.vercel.app', // URL del frontend su Vercel
       'http://localhost:3000',                  // Per sviluppo locale
       'http://localhost:5000'                   // Per sviluppo monolitico
     ];
     ```

2. **Aggiorna il file frontend `vercel.json`**:
   - Assicurati che l'URL di destinazione punti al tuo backend Railway:
     ```json
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://tuo-backend-railway.up.railway.app/api/:path*"
       }
     ]
     ```

3. **Aggiorna le variabili d'ambiente su Vercel**:
   - Verifica che `VITE_API_URL` punti all'URL corretto del backend

### 4. Verifica dell'Integrazione

1. Apri l'URL del frontend Vercel nel browser
2. Assicurati che il frontend comunichi correttamente con il backend
3. Verifica le funzionalità di gestione dei giochi, dei badge e delle ricompense
4. Controlla che le chiamate all'API Feltrinelli funzionino correttamente

## Deployment Monolitico (Alternativa)

Se preferisci un deployment monolitico dove frontend e backend vengono distribuiti insieme:

1. **Prepara il build del progetto**:
   ```bash
   npm run build
   ```

2. **Avvia l'applicazione in produzione**:
   ```bash
   npm run start
   ```

3. **Per il deployment su Railway**:
   - Semplicemente configura Railway per utilizzare il comando `npm run start` come specificato nel `Procfile`
   - Railway servirà sia l'API che l'interfaccia utente dallo stesso dominio

## Processo di Continuous Integration (CI)

Un file di configurazione GitHub Actions è disponibile nel repository per automatizzare il processo di build e test:

1. **GitHub Actions CI**:
   - Esegue controlli di tipo TypeScript
   - Esegue il build del progetto
   - Memorizza nella cache gli artefatti del build

2. **Integrazione con Railway e Vercel**:
   - Sia Railway che Vercel supportano l'integrazione diretta con GitHub
   - I nuovi commit sulla branch principale attivano automaticamente nuovi deployment

## Note sulla sicurezza

1. **Protezione delle variabili d'ambiente**:
   - Assicurati che le chiavi Supabase e altri segreti siano correttamente memorizzati come variabili d'ambiente sicure
   - Non salvare mai le chiavi API direttamente nel codice

2. **CORS**:
   - In produzione, restringe gli header CORS per consentire solo origini specifiche
   - Utilizza la configurazione CORS in `server/index.ts` per limitare le origini alle sole necessarie

3. **Monitoraggio**:
   - Utilizza le funzionalità di logging e monitoraggio offerte da Railway e Vercel per tracciare problemi di produzione
