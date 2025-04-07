# Feltrinelli Game Engine API Documentation (Aggiornata)

## Overview
Questa documentazione descrive le API del Game Engine utilizzate dall'applicazione Feltrinelli. L'applicazione funziona come un motore di gioco centralizzato (master) che fornisce API per client (a partire da Feltrinelli).

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://feltrinelli-api.railway.app`

## Health Check

### GET /api/health
Verifica lo stato del Game Engine API principale.

**Risposta di successo:**
```json
{
  "status": "ok",
  "message": "Gaming Engine API is running"
}
```

### GET /api/health-check
Endpoint alternativo di health check.

**Risposta di successo:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### GET /api/feltrinelli/health
Verifica la connessione con le API di Feltrinelli.

**Risposta di successo:**
```json
{
  "status": "ok",
  "message": "Feltrinelli Gaming API is connected"
}
```

## Game IDs

### GET /api/feltrinelli/game-ids
Ottiene gli identificatori per tutti i tipi di gioco disponibili.

**Risposta di successo:**
```json
{
  "books": "00000000-0000-0000-0000-000000000001",
  "authors": "00000000-0000-0000-0000-000000000002",
  "years": "00000000-0000-0000-0000-000000000003"
}
```

## Giochi

### GET /api/feltrinelli/games
Ottiene l'elenco di tutti i giochi disponibili.

**Parametri Query:**
- `active` (opzionale): Se impostato a `true`, restituisce solo i giochi attivi nel periodo corrente

**Risposta di successo:**
```json
[
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "feltrinelli_id": "00000000-0000-0000-0000-000000000001",
    "internal_id": 1,
    "name": "IndovinaLibro",
    "description": "Indovina il libro dall'estratto dell'abstract",
    "is_active": true,
    "start_date": "2023-01-01T00:00:00Z",
    "end_date": "2023-12-31T23:59:59Z",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": "00000000-0000-0000-0000-000000000002",
    "feltrinelli_id": "00000000-0000-0000-0000-000000000002",
    "internal_id": 2,
    "name": "Indovina l'Autore",
    "description": "Indovina l'autore dei libri mostrati",
    "is_active": true,
    "start_date": null,
    "end_date": null,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
]
```

### GET /api/feltrinelli/games/:id
Ottiene i dettagli di un gioco specifico e le sue impostazioni.

**Parametri Path:**
- `id`: ID del gioco in formato UUID

**Risposta di successo:**
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "IndovinaLibro",
  "description": "Indovina il libro dall'estratto dell'abstract",
  "is_active": true,
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-12-31T23:59:59Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "flt_game_settings": {
    "id": "7f8d9a1b-2c3d-4e5f-6g7h-8i9j0k1l2m3n",
    "game_id": "00000000-0000-0000-0000-000000000001",
    "timer_duration": 30,
    "question_count": 5,
    "difficulty": 1,
    "active": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  }
}
```

### GET /api/feltrinelli/game-settings/:gameId
Ottiene le impostazioni specifiche di un gioco.

**Parametri Path:**
- `gameId`: ID del gioco in formato UUID

**Risposta di successo:**
```json
{
  "id": "7f8d9a1b-2c3d-4e5f-6g7h-8i9j0k1l2m3n",
  "game_id": "00000000-0000-0000-0000-000000000001",
  "timer_duration": 30,
  "question_count": 5,
  "difficulty": 1,
  "active": true,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

## Gestione Sessioni di Gioco

### POST /api/feltrinelli/session
Crea una nuova sessione di gioco per un tipo specifico.

**Request:**
```json
{
  "userId": "00000000-0000-0000-0000-000000000099",
  "gameType": "books"
}
```

**Parametri:**
- `userId`: ID utente in formato UUID
- `gameType`: Tipo di gioco, uno tra: `books`, `authors`, `years`

**Risposta di successo:**
```json
{
  "session_id": "session-uuid",
  "user_id": "00000000-0000-0000-0000-000000000099",
  "game_id": "00000000-0000-0000-0000-000000000001",
  "created_at": "2023-01-01T12:00:00Z",
  "score": 0,
  "completed": false
}
```

### POST /api/games/session (alternativo)
Endpoint alternativo per creare una sessione di gioco.

**Request:**
```json
{
  "user_id": "00000000-0000-0000-0000-000000000099",
  "game_id": "00000000-0000-0000-0000-000000000001"
}
```

**Parametri:**
- `user_id`: ID utente in formato UUID
- `game_id`: ID del gioco in formato UUID (vedi /api/feltrinelli/game-ids)

**Risposta di successo:**
Identica a /api/feltrinelli/session

## Quiz Libri

### GET /api/feltrinelli/bookquiz/question
Ottiene una domanda casuale per il quiz sui libri.

**Parametri Query:**
- `difficulty` (opzionale): Livello di difficoltà (default: 1)

**Risposta di successo:**
```json
{
  "question_id": "question-uuid",
  "question_text": "Indovina il libro da questo estratto:",
  "abstract_snippet": "Testo dell'estratto...",
  "options": [
    {
      "id": "option-uuid-1",
      "title": "Titolo Libro 1",
      "author": "Autore 1",
      "image_url": "url-immagine-1"
    },
    {
      "id": "option-uuid-2",
      "title": "Titolo Libro 2",
      "author": "Autore 2",
      "image_url": "url-immagine-2"
    },
    {
      "id": "option-uuid-3",
      "title": "Titolo Libro 3",
      "author": "Autore 3",
      "image_url": "url-immagine-3"
    },
    {
      "id": "option-uuid-4",
      "title": "Titolo Libro 4",
      "author": "Autore 4",
      "image_url": "url-immagine-4"
    }
  ]
}
```

### POST /api/feltrinelli/bookquiz/answer
Invia una risposta per una domanda del quiz sui libri.

**Request:**
```json
{
  "sessionId": "session-uuid",
  "questionId": "question-uuid",
  "answerOptionId": "option-uuid-2",
  "timeTaken": 5.2
}
```

**Parametri:**
- `sessionId`: ID della sessione di gioco
- `questionId`: ID della domanda
- `answerOptionId`: ID dell'opzione selezionata
- `timeTaken`: Tempo impiegato in secondi

**Risposta di successo:**
```json
{
  "is_correct": true,
  "message": "Risposta corretta!",
  "points": 10
}
```

## Quiz Autori

### GET /api/feltrinelli/authorquiz/question
Ottiene una domanda casuale per il quiz sugli autori.

**Parametri Query:**
- `difficulty` (opzionale): Livello di difficoltà (default: 1)

**Risposta di successo:**
```json
{
  "question_id": "question-uuid",
  "question_text": "Chi è l'autore di questi libri?",
  "books": [
    {
      "id": "book-uuid-1",
      "title": "Titolo Libro 1",
      "image_url": "url-immagine-1"
    },
    {
      "id": "book-uuid-2",
      "title": "Titolo Libro 2",
      "image_url": "url-immagine-2"
    }
  ],
  "options": [
    {
      "id": "author-uuid-1",
      "name": "Nome Autore 1"
    },
    {
      "id": "author-uuid-2",
      "name": "Nome Autore 2"
    },
    {
      "id": "author-uuid-3",
      "name": "Nome Autore 3"
    },
    {
      "id": "author-uuid-4",
      "name": "Nome Autore 4"
    }
  ],
  "correct_author": {
    "id": "author-uuid-2",
    "name": "Nome Autore 2"
  }
}
```

### POST /api/feltrinelli/authorquiz/answer
Invia una risposta per una domanda del quiz sugli autori.

**Request:**
```json
{
  "sessionId": "session-uuid",
  "questionId": "question-uuid",
  "answerOptionId": "author-uuid-2",
  "timeTaken": 4.8
}
```

**Parametri:**
- `sessionId`: ID della sessione di gioco
- `questionId`: ID della domanda
- `answerOptionId`: ID dell'opzione selezionata
- `timeTaken`: Tempo impiegato in secondi

**Risposta di successo:**
```json
{
  "is_correct": true,
  "message": "Risposta corretta!",
  "points": 10
}
```

## Quiz Anni

### GET /api/feltrinelli/yearquiz/question
Ottiene una domanda casuale per il quiz sugli anni di pubblicazione.

**Parametri Query:**
- `difficulty` (opzionale): Livello di difficoltà (default: 1)

**Risposta di successo:**
```json
{
  "question_id": "question-uuid",
  "question_text": "In quale anno è stato pubblicato questo libro?",
  "book": {
    "id": "book-uuid",
    "title": "Titolo Libro",
    "author": "Nome Autore",
    "image_url": "url-immagine"
  },
  "options": [1985, 1990, 1995, 2000],
  "correct_year": 1990
}
```

### POST /api/feltrinelli/yearquiz/answer
Invia una risposta per una domanda del quiz sugli anni.

**Request:**
```json
{
  "sessionId": "session-uuid",
  "questionId": "question-uuid",
  "answerYear": 1990,
  "timeTaken": 3.5
}
```

**Parametri:**
- `sessionId`: ID della sessione di gioco
- `questionId`: ID della domanda
- `answerYear`: Anno selezionato come risposta
- `timeTaken`: Tempo impiegato in secondi

**Risposta di successo:**
```json
{
  "is_correct": true,
  "message": "Risposta corretta!",
  "points": 10
}
```

## Classifiche

### GET /api/feltrinelli/leaderboard
Ottiene la classifica globale per tutti i giochi.

**Parametri Query:**
- `period` (opzionale): Periodo della classifica (`all_time`, `monthly`, `weekly`), default: `all_time`
- `limit` (opzionale): Numero massimo di risultati, default: 10

**Risposta di successo:**
```json
{
  "data": [
    {
      "id": "leaderboard-entry-uuid-1",
      "user_id": "user-uuid-1",
      "points": 150,
      "users": {
        "username": "nomeutente1",
        "avatar_url": "url-avatar-1"
      }
    },
    {
      "id": "leaderboard-entry-uuid-2",
      "user_id": "user-uuid-2",
      "points": 120,
      "users": {
        "username": "nomeutente2",
        "avatar_url": "url-avatar-2"
      }
    }
  ]
}
```

### GET /api/feltrinelli/leaderboard/:gameType
Ottiene la classifica per un tipo di gioco specifico.

**Parametri Path:**
- `gameType`: Tipo di gioco (`books`, `authors`, `years`)

**Parametri Query:**
- `period` (opzionale): Periodo della classifica (`all_time`, `monthly`, `weekly`), default: `all_time`
- `limit` (opzionale): Numero massimo di risultati, default: 10

**Risposta di successo:**
```json
{
  "data": [
    {
      "id": "leaderboard-entry-uuid-1",
      "user_id": "user-uuid-1",
      "game_id": "00000000-0000-0000-0000-000000000001",
      "points": 80,
      "users": {
        "username": "nomeutente1",
        "avatar_url": "url-avatar-1"
      }
    },
    {
      "id": "leaderboard-entry-uuid-2",
      "user_id": "user-uuid-2",
      "game_id": "00000000-0000-0000-0000-000000000001",
      "points": 65,
      "users": {
        "username": "nomeutente2",
        "avatar_url": "url-avatar-2"
      }
    }
  ]
}
```

### POST /api/feltrinelli/score
Invia un punteggio alla classifica.

**Request:**
```json
{
  "userId": "user-uuid",
  "gameType": "books",
  "correctAnswers": 4,
  "totalQuestions": 5,
  "sessionId": "session-uuid"
}
```

**Parametri:**
- `userId`: ID utente in formato UUID
- `gameType`: Tipo di gioco (`books`, `authors`, `years`)
- `correctAnswers`: Numero di risposte corrette
- `totalQuestions`: Numero totale di domande
- `sessionId`: ID della sessione di gioco

**Risposta di successo:**
```json
{
  "success": true,
  "message": "Punteggio aggiornato con successo"
}
```

## Premi

### GET /api/feltrinelli/rewards
Ottiene i premi disponibili per un tipo di gioco specifico.

**Parametri Query:**
- `gameType`: Tipo di gioco (`books`, `authors`, `years`)
- `period` (opzionale): Periodo (`all_time`, `monthly`, `weekly`), default: `all_time`

**Risposta di successo:**
```json
[
  {
    "id": "reward-uuid-1",
    "name": "Tazza Feltrinelli",
    "description": "Una tazza esclusiva Feltrinelli",
    "type": "merchandise",
    "value": "tazza",
    "icon": "cup",
    "color": "#33FFA1",
    "available": 5,
    "image_url": "https://www.lafeltrinelli.it/images/rewards/tazza.png",
    "is_active": true,
    "start_date": "2023-01-01T00:00:00Z",
    "end_date": "2025-12-31T23:59:59Z",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "rank": 1
  },
  {
    "id": "reward-uuid-2",
    "name": "Buono Sconto 10%",
    "description": "Buono sconto del 10% su tutti i libri",
    "type": "discount",
    "value": "10",
    "icon": "percent",
    "color": "#33A1FF",
    "available": 50,
    "image_url": "https://www.lafeltrinelli.it/images/rewards/buonosconto.png",
    "is_active": true,
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z",
    "rank": 2
  }
]
```

### GET /api/feltrinelli/rewards/user/:userId
Ottiene i premi ottenuti da un utente specifico.

**Parametri Path:**
- `userId`: ID dell'utente in formato UUID

**Risposta di successo:**
```json
[
  {
    "id": "user-reward-uuid-1",
    "user_id": "user-uuid",
    "reward_id": "reward-uuid-1",
    "game_id": "00000000-0000-0000-0000-000000000001",
    "period": "all_time",
    "rank": 1,
    "claimed_at": "2023-01-01T12:00:00Z",
    "reward": {
      "id": "reward-uuid-1",
      "name": "Tazza Feltrinelli",
      "description": "Una tazza esclusiva Feltrinelli",
      "image_url": "https://www.lafeltrinelli.it/images/rewards/tazza.png",
      "type": "merchandise",
      "value": "tazza",
      "icon": "cup",
      "color": "#33FFA1"
    }
  }
]
```

## Game Badges

### GET /api/feltrinelli/game-badges/:gameId
Ottiene i badge associati a un gioco specifico.

**Parametri Path:**
- `gameId`: ID del gioco in formato UUID

**Risposta di successo:**
```json
[
  {
    "id": "badge-uuid-1",
    "game_id": "00000000-0000-0000-0000-000000000001",
    "name": "Lettore Esperto",
    "description": "Ottenuto 100 punti nel quiz libri",
    "icon": "book",
    "color": "#FF5733",
    "created_at": "2023-01-01T00:00:00Z"
  },
  {
    "id": "badge-uuid-2",
    "game_id": "00000000-0000-0000-0000-000000000001",
    "name": "Risposte Rapide",
    "description": "Risposto a 10 domande in meno di 5 secondi ciascuna",
    "icon": "clock",
    "color": "#33A1FF",
    "created_at": "2023-01-01T00:00:00Z"
  }
]
```

## Esempi di utilizzo

### Esempio: Flusso di gioco completo per Quiz Libri

1. **Verificare che il gioco sia attivo:**
```javascript
const gamesResponse = await fetch('https://feltrinelli-api.railway.app/api/feltrinelli/games?active=true');
const games = await gamesResponse.json();
const booksGame = games.find(game => game.id === '00000000-0000-0000-0000-000000000001');

if (!booksGame) {
  console.error('Il gioco IndovinaLibro non è attualmente attivo');
  return;
}

// Ottieni le impostazioni del gioco
const settingsResponse = await fetch(`https://feltrinelli-api.railway.app/api/feltrinelli/game-settings/${booksGame.id}`);
const settings = await settingsResponse.json();
const questionCount = settings.question_count;
const timerDuration = settings.timer_duration;
const difficulty = settings.difficulty;
```

2. **Inizializzare una sessione di gioco:**
```javascript
const response = await fetch('https://feltrinelli-api.railway.app/api/feltrinelli/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '00000000-0000-0000-0000-000000000099',
    gameType: 'books'
  })
});
const session = await response.json();
const sessionId = session.session_id;
```

3. **Ottenere una domanda:**
```javascript
const questionResponse = await fetch(`https://feltrinelli-api.railway.app/api/feltrinelli/bookquiz/question?difficulty=${difficulty}`);
const question = await questionResponse.json();
```

4. **Inviare una risposta:**
```javascript
const answerResponse = await fetch('https://feltrinelli-api.railway.app/api/feltrinelli/bookquiz/answer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: sessionId,
    questionId: question.question_id,
    answerOptionId: question.options[0].id,
    timeTaken: 3.5
  })
});
const result = await answerResponse.json();
```

5. **Inviare il punteggio finale alla classifica:**
```javascript
const leaderboardResponse = await fetch('https://feltrinelli-api.railway.app/api/feltrinelli/score', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '00000000-0000-0000-0000-000000000099',
    gameType: 'books',
    correctAnswers: 4,
    totalQuestions: 5,
    sessionId: sessionId
  })
});
const leaderboardResult = await leaderboardResponse.json();
```

6. **Verificare i premi ottenuti:**
```javascript
const rewardsResponse = await fetch('https://feltrinelli-api.railway.app/api/feltrinelli/rewards/user/00000000-0000-0000-0000-000000000099');
const rewards = await rewardsResponse.json();
```

## Note Importanti

- Gli ID dei giochi sono UUID predefiniti:
  - Quiz Libri: `00000000-0000-0000-0000-000000000001`
  - Quiz Autori: `00000000-0000-0000-0000-000000000002`
  - Quiz Anni: `00000000-0000-0000-0000-000000000003`
- I giochi possono essere attivati/disattivati sia manualmente (tramite il campo `is_active`) che automaticamente in base alle date di inizio/fine (campi `start_date` e `end_date`)
- La difficoltà del gioco può essere configurata tramite il campo `difficulty` nelle impostazioni del gioco
- I punteggi vengono calcolati automaticamente dal backend in base al numero di risposte corrette e al tempo impiegato
- Le classifiche sono disponibili per diversi periodi: generale (`all_time`), mensile (`monthly`) e settimanale (`weekly`)
- I premi sono associati alle posizioni in classifica e possono avere un periodo di validità definito tramite i campi `start_date` e `end_date`
- Tutti gli endpoint richiedono che l'ID utente sia in formato UUID
- Le immagini per libri, profili utente e premi sono fornite come URL completi
