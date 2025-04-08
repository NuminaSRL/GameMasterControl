# Documentazione API di Configurazione Feltrinelli

Questa documentazione descrive gli endpoint di configurazione e gestione forniti dal Game Engine per l'integrazione con i client Feltrinelli.

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

## Giochi Attivi

### GET /api/feltrinelli/games
Ottiene l'elenco di tutti i giochi disponibili.

**Risposta di successo:**
```json
[
  {
    "id": "c76400ec-530e-4314-a688-4bbc9b69b3cd",
    "name": "Quiz Libri",
    "description": "Indovina il libro da un estratto",
    "active": true,
    "created_at": "2025-04-07T11:06:39.330224",
    "updated_at": "2025-04-07T11:06:39.330224"
  },
  {
    "id": "a9b8c7d6-e5f4-3g2h-1i0j-k9l8m7n6o5p4",
    "name": "Quiz Autori",
    "description": "Indovina l'autore dai suoi libri",
    "active": true,
    "created_at": "2025-04-07T11:06:39.330224",
    "updated_at": "2025-04-07T11:06:39.330224"
  }
]
```

### GET /api/feltrinelli/games/:id
Ottiene i dettagli di un gioco specifico.

**Parametri Path:**
- `id`: ID del gioco in formato UUID

**Risposta di successo:**
```json
{
  "id": "c76400ec-530e-4314-a688-4bbc9b69b3cd",
  "name": "Quiz Libri",
  "description": "Indovina il libro da un estratto",
  "active": true,
  "created_at": "2025-04-07T11:06:39.330224",
  "updated_at": "2025-04-07T11:06:39.330224"
}
```

## Impostazioni di Gioco

### GET /api/feltrinelli/game-settings/:gameId
Ottiene le impostazioni di un gioco specifico.

**Parametri Path:**
- `gameId`: ID del gioco in formato UUID

**Risposta di successo:**
```json
{
  "id": "50c9e96a-f716-4f56-9dde-4b1b52dd2c07",
  "game_id": "c76400ec-530e-4314-a688-4bbc9b69b3cd",
  "time_duration": 30,
  "question_count": 5,
  "active": true,
  "created_at": "2025-04-07T12:44:09.851768+00:00",
  "updated_at": "2025-04-07T12:44:09.851768+00:00"
}
```

## Badges

### GET /api/feltrinelli/badges
Ottiene tutti i badges disponibili.

**Risposta di successo:**
```json
[
  {
    "id": 1,
    "name": "Esperto di Libri",
    "description": "Hai completato 10 quiz sui libri",
    "icon": "book",
    "color": "#FF5733",
    "created_at": "2025-04-07T12:44:09.851768+00:00"
  },
  {
    "id": 2,
    "name": "Velocista Letterario",
    "description": "Hai risposto correttamente in meno di 5 secondi",
    "icon": "lightning",
    "color": "#33A1FF",
    "created_at": "2025-04-07T12:44:09.851768+00:00"
  }
]
```

### GET /api/feltrinelli/games/:gameId/badges
Ottiene i badges associati a un gioco specifico.

**Parametri Path:**
- `gameId`: ID del gioco in formato UUID

**Risposta di successo:**
```json
{
  "game_id": "c76400ec-530e-4314-a688-4bbc9b69b3cd",
  "badges": [
    {
      "id": 1,
      "name": "Esperto di Libri",
      "description": "Hai completato 10 quiz sui libri",
      "icon": "book",
      "color": "#FF5733"
    },
    {
      "id": 3,
      "name": "Maestro Narratore",
      "description": "Hai ottenuto un punteggio perfetto",
      "icon": "star",
      "color": "#FFFF33"
    }
  ]
}
```

## Premi

### GET /api/feltrinelli/rewards-all
Ottiene tutti i premi configurati nel sistema.

**Risposta di successo:**
```json
[
  {
    "id": "e0da3f4d-9589-463f-9333-3c2256528054",
    "name": "Tazza Feltrinelli",
    "description": "La nostra tazza pensata per i lettori",
    "game_id": "00000000-0000-0000-0000-000000000002",
    "type": "merchandise",
    "value": "tazza",
    "icon": "cup",
    "color": "#33A1FF",
    "available": 5,
    "active": true,
    "created_at": "2025-04-04T09:29:29.536217+00:00",
    "updated_at": "2025-04-04T09:29:29.536217+00:00"
  },
  {
    "id": "6d82c2c0-9953-45d2-8ee2-b0a2c6f7a083",
    "name": "Buono sconto",
    "description": "Uno sconto del 10% sul catalogo musica",
    "game_id": "00000000-0000-0000-0000-000000000001",
    "type": "coupon",
    "value": "10%",
    "icon": "gift",
    "color": "#FF5733",
    "available": 10,
    "active": true,
    "created_at": "2025-04-04T09:29:29.434213+00:00",
    "updated_at": "2025-04-04T09:29:29.434213+00:00"
  }
]
```

### GET /api/feltrinelli/rewards
Ottiene i premi disponibili per un gioco e un periodo specifici.

**Parametri Query:**
- `gameType`: Tipo di gioco (`books`, `authors`, `years`)
- `period` (opzionale): Periodo della classifica (`all_time`, `monthly`, `weekly`), default: `all_time`

**Risposta di successo:**
```json
{
  "success": true,
  "rewards": [
    {
      "id": "reward-uuid-1",
      "name": "Tazza Feltrinelli",
      "description": "Una tazza esclusiva Feltrinelli",
      "image_url": "url-immagine-tazza",
      "points_required": 100,
      "rank": 1
    },
    {
      "id": "reward-uuid-2",
      "name": "Buono Sconto 10%",
      "description": "Buono sconto del 10% su tutti i libri",
      "image_url": "url-immagine-buono",
      "points_required": 50,
      "rank": 2
    }
  ]
}
```

### GET /api/feltrinelli/rewards/user/:userId
Ottiene i premi ottenuti da un utente specifico.

**Parametri Path:**
- `userId`: ID dell'utente in formato UUID

**Risposta di successo:**
```json
{
  "success": true,
  "rewards": [
    {
      "id": "user-reward-uuid-1",
      "user_id": "user-uuid",
      "reward_id": "reward-uuid-1",
      "game_id": "00000000-0000-0000-0000-000000000001",
      "period": "all_time",
      "rank": 1,
      "claimed_at": "2025-01-01T12:00:00Z",
      "rewards": {
        "name": "Tazza Feltrinelli",
        "description": "Una tazza esclusiva Feltrinelli",
        "image_url": "url-immagine-tazza"
      }
    }
  ]
}
```

## Esempi di utilizzo

### Verifica dello stato del sistema
```javascript
fetch('/api/feltrinelli/health')
  .then(response => response.json())
  .then(data => {
    if (data.status === 'ok') {
      console.log('Il sistema è operativo');
    } else {
      console.error('Il sistema non è disponibile', data.message);
    }
  });
```

### Ottenere gli ID dei giochi
```javascript
fetch('/api/feltrinelli/game-ids')
  .then(response => response.json())
  .then(data => {
    const bookQuizId = data.books;
    const authorQuizId = data.authors;
    const yearQuizId = data.years;
    
    console.log('ID Quiz Libri:', bookQuizId);
  });
```

### Ottenere l'elenco dei giochi attivi
```javascript
fetch('/api/feltrinelli/games')
  .then(response => response.json())
  .then(games => {
    const activeGames = games.filter(game => game.active);
    console.log('Giochi attivi:', activeGames);
  });
```

### Ottenere le impostazioni di un gioco
```javascript
const gameId = '00000000-0000-0000-0000-000000000001';

fetch(`/api/feltrinelli/game-settings/${gameId}`)
  .then(response => response.json())
  .then(settings => {
    const timerDuration = settings.time_duration;
    const questionCount = settings.question_count;
    
    console.log(`Impostazione timer: ${timerDuration} secondi`);
    console.log(`Numero di domande: ${questionCount}`);
    
    // Configura il gioco con questi parametri
    setupGameTimer(timerDuration);
    prepareQuestionSet(questionCount);
  });
```

### Ottenere i badges di un gioco
```javascript
const gameId = '00000000-0000-0000-0000-000000000001';

fetch(`/api/feltrinelli/games/${gameId}/badges`)
  .then(response => response.json())
  .then(data => {
    console.log('Badges disponibili per questo gioco:', data.badges);
    
    // Visualizza i badges nella UI
    displayAvailableBadges(data.badges);
  });
```

### Ottenere tutti i premi disponibili
```javascript
fetch('/api/feltrinelli/rewards-all')
  .then(response => response.json())
  .then(rewards => {
    console.log('Tutti i premi disponibili:', rewards);
    
    // Filtra i premi attivi
    const activeRewards = rewards.filter(reward => reward.active);
    displayAllRewards(activeRewards);
  });
```