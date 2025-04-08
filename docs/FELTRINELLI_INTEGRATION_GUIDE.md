# Guida all'Integrazione Feltrinelli

Questo documento fornisce una guida dettagliata per integrare l'app Feltrinelli con il nostro Game Engine.

## Panoramica

Il Game Engine fornisce API RESTful per gestire tutti gli aspetti dei quiz letterari:
- Gestione delle sessioni di gioco
- Domande e risposte per i tre tipi di quiz: Libri, Autori e Anni di pubblicazione
- Classifiche globali e per singolo gioco
- Sistema di premi e distintivi

## Configurazione

### 1. URL del Game Engine API

In ambiente di produzione, l'URL base delle API è:
```
https://feltrinelli-api.railway.app/api
```

In ambiente di sviluppo, l'URL base è:
```
http://localhost:3000/api
```

### 2. Configurazione nel Client Feltrinelli

Configura il client Feltrinelli per utilizzare l'URL base sopra indicato per tutte le chiamate API relative ai giochi.

Esempio di configurazione in ambiente React:
```javascript
// api-config.js
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://feltrinelli-api.railway.app/api'
  : 'http://localhost:3000/api';

export const fetchFromAPI = async (endpoint, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Si è verificato un errore');
  }
  
  return response.json();
};
```

## Flusso di Gioco

### 1. Inizializzazione di una Sessione di Gioco

Prima di iniziare un gioco, è necessario creare una sessione:

```javascript
// Ottieni l'ID utente dal sistema di autenticazione di Feltrinelli
const userId = getFeltrinelliUserId();

// Crea una sessione per un quiz specifico
const createSession = async (gameType) => {
  const session = await fetchFromAPI('/feltrinelli/session', {
    method: 'POST',
    body: JSON.stringify({
      userId: userId,
      gameType: gameType // 'books', 'authors', o 'years'
    })
  });
  
  return session; // Contiene session_id necessario per le risposte
};
```

### 2. Ottenere Domande

A seconda del tipo di quiz, utilizzare gli endpoint corrispondenti:

#### Quiz Libri
```javascript
const getBookQuestion = async (difficulty = 1) => {
  return await fetchFromAPI(`/feltrinelli/bookquiz/question?difficulty=${difficulty}`);
};
```

#### Quiz Autori
```javascript
const getAuthorQuestion = async (difficulty = 1) => {
  return await fetchFromAPI(`/feltrinelli/authorquiz/question?difficulty=${difficulty}`);
};
```

#### Quiz Anni
```javascript
const getYearQuestion = async (difficulty = 1) => {
  return await fetchFromAPI(`/feltrinelli/yearquiz/question?difficulty=${difficulty}`);
};
```

### 3. Inviare Risposte

#### Quiz Libri
```javascript
const submitBookAnswer = async (sessionId, questionId, answerOptionId, timeTaken) => {
  return await fetchFromAPI('/feltrinelli/bookquiz/answer', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: sessionId,
      questionId: questionId,
      answerOptionId: answerOptionId,
      timeTaken: timeTaken // tempo in secondi
    })
  });
};
```

#### Quiz Autori
```javascript
const submitAuthorAnswer = async (sessionId, questionId, answerOptionId, timeTaken) => {
  return await fetchFromAPI('/feltrinelli/authorquiz/answer', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: sessionId,
      questionId: questionId,
      answerOptionId: answerOptionId,
      timeTaken: timeTaken
    })
  });
};
```

#### Quiz Anni
```javascript
const submitYearAnswer = async (sessionId, questionId, answerYear, timeTaken) => {
  return await fetchFromAPI('/feltrinelli/yearquiz/answer', {
    method: 'POST',
    body: JSON.stringify({
      sessionId: sessionId,
      questionId: questionId,
      answerYear: answerYear, // l'anno selezionato come risposta
      timeTaken: timeTaken
    })
  });
};
```

### 4. Inviare il Punteggio Finale

Alla fine della sessione di gioco, inviare il punteggio finale:

```javascript
const submitFinalScore = async (gameType, correctAnswers, totalQuestions, sessionId) => {
  return await fetchFromAPI('/feltrinelli/score', {
    method: 'POST',
    body: JSON.stringify({
      userId: userId,
      gameType: gameType,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      sessionId: sessionId
    })
  });
};
```

### 5. Visualizzare le Classifiche

#### Classifica Globale
```javascript
const getGlobalLeaderboard = async (period = 'all_time', limit = 10) => {
  return await fetchFromAPI(`/feltrinelli/leaderboard?period=${period}&limit=${limit}`);
};
```

#### Classifica per un Gioco Specifico
```javascript
const getGameLeaderboard = async (gameType, period = 'all_time', limit = 10) => {
  return await fetchFromAPI(`/feltrinelli/leaderboard/${gameType}?period=${period}&limit=${limit}`);
};
```

### 6. Gestire i Premi

#### Ottenere i Premi Disponibili
```javascript
const getAvailableRewards = async (gameType, period = 'all_time') => {
  return await fetchFromAPI(`/feltrinelli/rewards?gameType=${gameType}&period=${period}`);
};
```

#### Ottenere i Premi dell'Utente
```javascript
const getUserRewards = async () => {
  return await fetchFromAPI(`/feltrinelli/rewards/user/${userId}`);
};
```

## Gestione degli Errori

Implementare una gestione degli errori per gestire i casi in cui il server non risponde o restituisce errori:

```javascript
const fetchFromAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Si è verificato un errore');
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Errore nella chiamata API a ${endpoint}:`, error);
    
    // Implementare logica di retry o fallback
    if (error.message.includes('Network') || error.message.includes('timeout')) {
      // Gestire errori di rete
      notifyUser('Controlla la tua connessione e riprova');
    } else {
      // Gestire altri errori
      notifyUser(`Errore: ${error.message}`);
    }
    
    throw error;
  }
};
```

## Considerazioni sull'UI

1. **Mostrare timer**: Per ogni domanda, visualizzare un timer che indichi il tempo rimanente in base a `timer_duration` configurato per il gioco.

2. **Visualizzare feedback**: Dopo ogni risposta, mostrare un feedback visivo (corretto/errato) e il punteggio parziale.

3. **Classifiche**: Implementare diverse visualizzazioni per le classifiche (giornaliere, settimanali, mensili, di tutti i tempi).

4. **Profilo utente**: Creare una pagina del profilo che mostri i distintivi guadagnati e i premi ottenuti.

## Test e Validazione

Prima di passare in produzione, eseguire i seguenti test:

1. **Test di connettività**: Verificare che tutte le chiamate API funzionino correttamente.
2. **Test completo di sessione**: Completare intere sessioni di gioco per ogni tipo di quiz.
3. **Test delle classifiche**: Verificare che i punteggi vengano registrati correttamente.
4. **Test dei premi**: Verificare che i premi vengano assegnati correttamente.

## Supporto

Per assistenza con l'integrazione, contattare:
- Email: supporto-api@feltrinelli.it
- Portale sviluppatori: https://developers.feltrinelli.it

## Documentazione Completa delle API

Per una documentazione completa di tutte le API disponibili, fare riferimento al file [API_Documentation.md](./API_Documentation.md).