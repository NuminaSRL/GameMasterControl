import fetch, { Response, RequestInit } from 'node-fetch';

// Definizione dei tipi di risposta dalle API
interface BookQuizQuestion {
  question_id: string;
  question_text: string;
  abstract_snippet: string;
  options: {
    id: string;
    title: string;
    author: string;
    image_url: string;
  }[];
}

interface AuthorQuizQuestion {
  question_id: string;
  question_text: string;
  books: {
    id: string;
    title: string;
    image_url: string;
  }[];
  options: {
    id: string;
    name: string;
  }[];
  correct_author: {
    id: string;
    name: string;
  };
}

interface YearQuizQuestion {
  question_id: string;
  question_text: string;
  book: {
    id: string;
    title: string;
    author: string;
    image_url: string;
  };
  options: number[];
  correct_year: number;
}

interface GameSession {
  session_id: string;
  user_id: string;
  game_id: string;
  created_at: string;
  score: number;
  completed: boolean;
}

interface AnswerResult {
  is_correct: boolean;
  message: string;
  points: number;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id?: string;
  points: number;
  users: {
    username: string;
    avatar_url: string;
  };
}

interface Reward {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_required: number;
  rank: number;
}

// Configurazione base
const API_BASE_URL = process.env.FELTRINELLI_API_URL || 'http://localhost:3000';
// Rimuoviamo '/api' dalla fine dell'URL per evitare il doppio prefisso
const CLEAN_API_URL = API_BASE_URL.endsWith('/api') 
  ? API_BASE_URL.slice(0, -4)  // Rimuove '/api' dalla fine
  : API_BASE_URL;

export const GAME_IDS = {
  BOOK_QUIZ: '00000000-0000-0000-0000-000000000001',
  AUTHOR_QUIZ: '00000000-0000-0000-0000-000000000002',
  YEAR_QUIZ: '00000000-0000-0000-0000-000000000003'
};

// Interfacce per le risposte API
interface HealthResponse {
  status: string;
  message: string;
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
}

interface RewardsResponse {
  success: boolean;
  rewards: Reward[];
}

interface SubmitScoreResponse {
  success: boolean;
  message: string;
}

// Metodi di utilità
async function fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return await response.json() as T;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Funzioni per interagire con le API di Feltrinelli
export async function healthCheck(): Promise<boolean> {
  try {
    // Utilizziamo CLEAN_API_URL per evitare il doppio '/api'
    // Proviamo prima con '/api/health-check', se fallisce proviamo con '/api/health'
    try {
      console.log(`Attempting to connect to ${CLEAN_API_URL}/api/health-check`);
      const response = await fetchWithErrorHandling<HealthResponse>(`${CLEAN_API_URL}/api/health-check`);
      return (response as HealthResponse).status === 'ok';
    } catch (error) {
      // Fallback a /api/health
      console.log(`Fallback to ${CLEAN_API_URL}/api/health`);
      const response = await fetchWithErrorHandling<HealthResponse>(`${CLEAN_API_URL}/api/health`);
      return (response as HealthResponse).status === 'ok';
    }
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// Gestione sessioni
export async function createGameSession(userId: string, gameType: 'books' | 'authors' | 'years'): Promise<GameSession> {
  let gameId;
  
  switch (gameType) {
    case 'books':
      gameId = GAME_IDS.BOOK_QUIZ;
      break;
    case 'authors':
      gameId = GAME_IDS.AUTHOR_QUIZ;
      break;
    case 'years':
      gameId = GAME_IDS.YEAR_QUIZ;
      break;
  }
  
  return await fetchWithErrorHandling<GameSession>(`${CLEAN_API_URL}/api/games/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, game_id: gameId })
  });
}

// Quiz Libri
export async function getBookQuizQuestion(difficulty: number = 1): Promise<BookQuizQuestion> {
  return await fetchWithErrorHandling<BookQuizQuestion>(`${CLEAN_API_URL}/api/games/bookquiz/question?difficulty=${difficulty}`);
}

export async function submitBookQuizAnswer(
  sessionId: string, 
  questionId: string, 
  answerOptionId: string, 
  timeTaken: number
): Promise<AnswerResult> {
  return await fetchWithErrorHandling<AnswerResult>(`${CLEAN_API_URL}/api/games/bookquiz/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
      answer_option_id: answerOptionId,
      time_taken: timeTaken
    })
  });
}

// Quiz Autori
export async function getAuthorQuizQuestion(difficulty: number = 1): Promise<AuthorQuizQuestion> {
  return await fetchWithErrorHandling<AuthorQuizQuestion>(`${CLEAN_API_URL}/api/games/authorquiz/question?difficulty=${difficulty}`);
}

export async function submitAuthorQuizAnswer(
  sessionId: string, 
  questionId: string, 
  answerOptionId: string, 
  timeTaken: number
): Promise<AnswerResult> {
  return await fetchWithErrorHandling<AnswerResult>(`${CLEAN_API_URL}/api/games/authorquiz/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
      answer_option_id: answerOptionId,
      time_taken: timeTaken
    })
  });
}

// Quiz Anni
export async function getYearQuizQuestion(difficulty: number = 1): Promise<YearQuizQuestion> {
  return await fetchWithErrorHandling<YearQuizQuestion>(`${CLEAN_API_URL}/api/games/yearquiz/question?difficulty=${difficulty}`);
}

export async function submitYearQuizAnswer(
  sessionId: string, 
  questionId: string, 
  answerYear: number, 
  timeTaken: number
): Promise<AnswerResult> {
  return await fetchWithErrorHandling<AnswerResult>(`${CLEAN_API_URL}/api/games/yearquiz/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      question_id: questionId,
      answer_year: answerYear,
      time_taken: timeTaken
    })
  });
}

// Classifiche
export async function getLeaderboard(
  period: 'all_time' | 'monthly' | 'weekly' = 'all_time', 
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const response = await fetchWithErrorHandling<LeaderboardResponse>(
    `${CLEAN_API_URL}/api/leaderboard?period=${period}&limit=${limit}`
  );
  return (response as LeaderboardResponse).data;
}

export async function getGameLeaderboard(
  gameId: string,
  period: 'all_time' | 'monthly' | 'weekly' = 'all_time', 
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  const response = await fetchWithErrorHandling<LeaderboardResponse>(
    `${CLEAN_API_URL}/api/leaderboard/${gameId}?period=${period}&limit=${limit}`
  );
  return (response as LeaderboardResponse).data;
}

export async function submitScore(
  userId: string,
  gameId: string,
  correctAnswers: number,
  totalQuestions: number,
  sessionId: string
): Promise<{ success: boolean, message: string }> {
  return await fetchWithErrorHandling<SubmitScoreResponse>(`${CLEAN_API_URL}/api/leaderboard/submit-all-periods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      gameId,
      correctAnswers,
      totalQuestions,
      sessionId
    })
  });
}

// Premi
export async function getAvailableRewards(
  gameId: string,
  period: 'all_time' | 'monthly' | 'weekly' = 'all_time'
): Promise<Reward[]> {
  const response = await fetchWithErrorHandling<RewardsResponse>(
    `${CLEAN_API_URL}/api/rewards/available?game_id=${gameId}&period=${period}`
  );
  return (response as RewardsResponse).rewards;
}

export async function getUserRewards(userId: string): Promise<Reward[]> {
  const response = await fetchWithErrorHandling<RewardsResponse>(`${CLEAN_API_URL}/api/rewards/user/${userId}`);
  return (response as RewardsResponse).rewards;
}

// Metodo conveniente per ottenere il game_id corretto in base al tipo
export function getGameIdByType(gameType: 'books' | 'authors' | 'years'): string {
  switch (gameType) {
    case 'books':
      return GAME_IDS.BOOK_QUIZ;
    case 'authors':
      return GAME_IDS.AUTHOR_QUIZ;
    case 'years':
      return GAME_IDS.YEAR_QUIZ;
    default:
      throw new Error(`Game type "${gameType}" not recognized`);
  }
}
