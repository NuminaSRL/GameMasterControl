import { Router } from 'express';
import * as feltrinelliApi from '../../../feltrinelli-api';
import { GAME_IDS } from '../../../feltrinelli-api';
import * as fltApi from '../../../flt-api';
import * as fltSimpleApi from '../../../flt-simple-api';
import * as userProfileApi from '../../../user-profile-api';
import { supabase } from '../../../supabase';

const router = Router();

// Sessione di gioco
router.post('/session', async (req, res) => {
  try {
    const { userId, gameType } = req.body;
    
    if (!userId || !gameType) {
      return res.status(400).json({ message: 'userId and gameType are required' });
    }
    
    if (!['books', 'authors', 'years'].includes(gameType)) {
      return res.status(400).json({ message: 'gameType must be one of: books, authors, years' });
    }
    
    // Verifichiamo che l'userId sia in formato UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({ 
        message: 'userId deve essere in formato UUID (es. 00000000-0000-0000-0000-000000000099)' 
      });
    }
    
    const session = await feltrinelliApi.createGameSession(userId, gameType as 'books' | 'authors' | 'years');
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: `Error creating game session: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Domande Quiz Libri
router.get('/bookquiz/question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
    const question = await feltrinelliApi.getBookQuizQuestion(difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: `Error fetching book quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Risposte Quiz Libri
router.post('/bookquiz/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerOptionId, timeTaken } = req.body;
    
    if (!sessionId || !questionId || !answerOptionId || timeTaken === undefined) {
      return res.status(400).json({ message: 'sessionId, questionId, answerOptionId, and timeTaken are required' });
    }
    
    const result = await feltrinelliApi.submitBookQuizAnswer(sessionId, questionId, answerOptionId, timeTaken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: `Error submitting book quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Domande Quiz Autori
router.get('/authorquiz/question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
    const question = await feltrinelliApi.getAuthorQuizQuestion(difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: `Error fetching author quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Risposte Quiz Autori
router.post('/authorquiz/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerOptionId, timeTaken } = req.body;
    
    if (!sessionId || !questionId || !answerOptionId || timeTaken === undefined) {
      return res.status(400).json({ message: 'sessionId, questionId, answerOptionId, and timeTaken are required' });
    }
    
    const result = await feltrinelliApi.submitAuthorQuizAnswer(sessionId, questionId, answerOptionId, timeTaken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: `Error submitting author quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Domande Quiz Anni
router.get('/yearquiz/question', async (req, res) => {
  try {
    const difficulty = req.query.difficulty ? parseInt(req.query.difficulty as string) : 1;
    const question = await feltrinelliApi.getYearQuizQuestion(difficulty);
    res.json(question);
  } catch (error) {
    res.status(500).json({ message: `Error fetching year quiz question: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Risposte Quiz Anni
router.post('/yearquiz/answer', async (req, res) => {
  try {
    const { sessionId, questionId, answerYear, timeTaken } = req.body;
    
    if (!sessionId || !questionId || answerYear === undefined || timeTaken === undefined) {
      return res.status(400).json({ message: 'sessionId, questionId, answerYear, and timeTaken are required' });
    }
    
    const result = await feltrinelliApi.submitYearQuizAnswer(sessionId, questionId, answerYear, timeTaken);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: `Error submitting year quiz answer: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Endpoint per recuperare tutti i giochi disponibili
router.get('/games', fltSimpleApi.getAllFLTGames);

// Endpoint per recuperare un gioco specifico con le sue impostazioni
router.get('/games/:id', fltSimpleApi.getFLTGame);

// Endpoint per recuperare le impostazioni di un gioco
router.get('/game-settings/:gameId', fltSimpleApi.getGameSettings);

// Endpoint per recuperare tutti i premi
router.get('/rewards-all', fltSimpleApi.getAllFLTRewards);

// Endpoint per recuperare tutti i badges di un gioco
router.get('/games/:gameId/badges', fltSimpleApi.getGameBadges);

// Endpoint per recuperare tutti i badges disponibili
router.get('/badges', fltSimpleApi.getAllBadges);

// Endpoint per recuperare un badge specifico tramite ID
router.get('/badges/:id', fltSimpleApi.getFLTBadge);

// Endpoint per recuperare il profilo completo utente con rewards e badges
router.get('/user-profile/:userId', userProfileApi.getUserProfile);

// Endpoint per recuperare i badges dell'utente per un gioco specifico
router.get('/user-game-badges/:userId/:gameId', userProfileApi.getUserGameBadges);

// Endpoint per recuperare i rewards dell'utente per un gioco specifico
router.get('/user-game-rewards/:userId/:gameId', userProfileApi.getUserGameRewards);

// Aggiungi qui altri endpoint specifici per Feltrinelli...

export default router;