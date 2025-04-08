import { Request, Response } from "express";
import { supabase, safeSupabaseQuery } from "./supabase";
import { z } from "zod";
import crypto from "crypto"; // Aggiungiamo l'import di crypto


export interface GameSessionResponse {
  session_id: string;
  user_id: string;
  game_id: string;
  created_at: string;
  score: number;
  completed: boolean;
}

export interface BookQuizQuestion {
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

export interface AuthorQuizQuestion {
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

export interface YearQuizQuestion {
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

export interface AnswerResult {
  is_correct: boolean;
  message: string;
  points: number;
}

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id?: string;
  points: number;
  users: {
    username: string;
    avatar_url: string | null;
  };
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_required: number | null;
  rank: number;
}

// HEALTH CHECK

export async function healthCheck(req: Request, res: Response) {
  try {
    return res.status(200).json({
      status: "ok",
      message: "Gaming Engine API is running"
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(500).json({
      status: "error",
      message: "Server error"
    });
  }
}

// GESTIONE SESSIONI DI GIOCO

export async function createGameSession(req: Request, res: Response) {
  try {
    const schema = z.object({
      user_id: z.string().uuid(),
      game_id: z.string().uuid()
    });

    const validatedData = schema.parse(req.body);
    const { user_id, game_id } = validatedData;

    // Verifica che l'utente esista
    const { data: userProfile, error: userError } = await supabase
      .from('flt_users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (userError || !userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verifica che il gioco esista e sia attivo
    const { data: gameData, error: gameError } = await supabase
      .from('flt_games')
      .select('*')
      .eq('id', game_id)
      .eq('is_active', true)
      .single();

    if (gameError || !gameData) {
      return res.status(404).json({ error: "Game not found or not active" });
    }

    // Crea una nuova sessione
    const sessionId = crypto.randomUUID();
    const { data: insertedSession, error: sessionError } = await supabase
      .from('flt_game_sessions')
      .insert({
        id: crypto.randomUUID(),
        session_id: sessionId,
        user_id: user_id,
        game_id: game_id,
        score: 0,
        completed: false
      })
      .select()
      .single();

    if (sessionError) {
      console.error("Error creating game session:", sessionError);
      return res.status(500).json({ error: "Failed to create game session" });
    }

    // Formatta la risposta come previsto dall'API Feltrinelli
    const response: GameSessionResponse = {
      session_id: insertedSession.session_id,
      user_id: insertedSession.user_id,
      game_id: insertedSession.game_id,
      created_at: insertedSession.created_at,
      score: insertedSession.score,
      completed: insertedSession.completed
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error("Error creating game session:", error);
    return res.status(500).json({ error: "Failed to create game session" });
  }
}

// API PER QUIZ SUI LIBRI

export async function getBookQuizQuestion(req: Request, res: Response) {
  try {
    const difficulty = parseInt(req.query.difficulty as string) || 1;
    
    // Recupera il gioco per il tipo "books"
    const { data: bookGame, error: gameError } = await supabase
      .from('flt_games')
      .select('*')
      .eq('game_type', 'books')
      .eq('is_active', true)
      .single();

    if (gameError || !bookGame) {
      return res.status(404).json({ error: "No active book quiz game found" });
    }

    // Qui dovremmo generare una domanda reale basata sul database
    // Per ora restituiamo una domanda di esempio
    const questionId = crypto.randomUUID();
    const question: BookQuizQuestion = {
      question_id: questionId,
      question_text: "Indovina il libro da questo estratto:",
      abstract_snippet: "In un mondo dove la tecnologia ha preso il sopravvento, un gruppo di ribelli cerca di riportare l'umanità a valori più autentici...",
      options: [
        {
          id: crypto.randomUUID(),
          title: "Il cerchio",
          author: "Dave Eggers",
          image_url: "https://www.lafeltrinelli.it/images/books/ilcerchio.jpg"
        },
        {
          id: crypto.randomUUID(),
          title: "1984",
          author: "George Orwell",
          image_url: "https://www.lafeltrinelli.it/images/books/1984.jpg"
        },
        {
          id: crypto.randomUUID(),
          title: "Fahrenheit 451",
          author: "Ray Bradbury",
          image_url: "https://www.lafeltrinelli.it/images/books/fahrenheit451.jpg"
        },
        {
          id: crypto.randomUUID(),
          title: "Brave New World",
          author: "Aldous Huxley",
          image_url: "https://www.lafeltrinelli.it/images/books/bravenewworld.jpg"
        }
      ]
    };

    // Registriamo la domanda e le risposte per poterle verificare in seguito
    const correctOptionId = question.options[1].id; // 1984 è la risposta corretta

    try {
      for (const option of question.options) {
        const { error } = await supabase
          .from('flt_answer_options')
          .insert({
            id: option.id,
            question_id: questionId,
            book_id: option.id, // Usiamo lo stesso ID come book ID per semplicità
            is_correct: option.id === correctOptionId
          });
          
        if (error) {
          console.warn(`Errore nell'inserimento dell'opzione ${option.id}:`, error.message);
          // Continuiamo con le altre opzioni anche se una fallisce
        }
      }
    } catch (insertError) {
      console.error("Errore durante l'inserimento delle opzioni:", insertError);
      // Non facciamo fallire l'intera richiesta se l'inserimento delle opzioni fallisce
    }
    
    // Aggiungi questo return che mancava
    return res.json(question);
    
  } catch (error) {
    console.error("Error getting book quiz question:", error);
    return res.status(500).json({ error: "Failed to get book quiz question" });
  }
}

export async function submitBookQuizAnswer(req: Request, res: Response) {
  try {
    const schema = z.object({
      session_id: z.string().uuid(),
      question_id: z.string().uuid(),
      answer_option_id: z.string().uuid(),
      time_taken: z.number()
    });

    const validatedData = schema.parse(req.body);
    const { session_id, question_id, answer_option_id, time_taken } = validatedData;

    // Verifica che la sessione esista
    const { data: session, error: sessionError } = await supabase
      .from('flt_game_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verifica la risposta
    const { data: answerOption, error: answerError } = await supabase
      .from('flt_answer_options')
      .select('*')
      .eq('id', answer_option_id)
      .eq('question_id', question_id)
      .single();

    if (answerError || !answerOption) {
      return res.status(404).json({ error: "Answer option not found" });
    }

    // Calcoliamo i punti in base alla correttezza e al tempo
    let points = 0;
    if (answerOption.is_correct) {
      // Punteggio base per risposta corretta
      points = 1;
      
      // Bonus per risposta veloce (sotto i 5 secondi)
      if (time_taken < 5) {
        points += 1;
      }
    }

    // Aggiorniamo il punteggio della sessione
    await supabase
      .from('flt_game_sessions')
      .update({ score: session.score + points })
      .eq('id', session.id);

    // Rispondiamo con il risultato
    return res.json({
      is_correct: answerOption.is_correct,
      message: answerOption.is_correct ? "Risposta corretta!" : "Risposta errata!",
      points
    });
  } catch (error) {
    console.error("Error submitting book quiz answer:", error);
    return res.status(500).json({ error: "Failed to submit answer" });
  }
}

// LEADERBOARD

// LEADERBOARD

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const period = (req.query.period as string) || "all_time";
    const limit = parseInt(req.query.limit as string) || 10;

    // Utilizziamo direttamente supabase invece di safeSupabaseQuery
    const { data: leaderboardEntries, error } = await supabase
      .from('flt_leaderboard')
      .select('*')
      .eq('period', period)
      .order('points', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return res.status(500).json({ error: "Failed to get leaderboard" });
    }

    // Verifichiamo che leaderboardEntries non sia null
    if (!leaderboardEntries || leaderboardEntries.length === 0) {
      return res.json({ data: [] });
    }

    const formattedEntries: LeaderboardEntry[] = await Promise.all(
      leaderboardEntries.map(async entry => {
        // Recupera le informazioni utente
        const { data: userProfile } = await supabase
          .from('flt_users')
          .select('*')
          .eq('user_id', entry.user_id)
          .single();

        return {
          id: entry.id,
          user_id: entry.user_id,
          game_id: entry.game_id,
          points: entry.points,
          users: {
            username: userProfile?.username || "Unknown",
            avatar_url: userProfile?.avatar_url || null
          }
        };
      })
    );

    return res.json({ data: formattedEntries });
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    return res.status(500).json({ error: "Failed to get leaderboard" });
  }
}

// IMPORTAZIONE DATI FELTRINELLI

export async function importFeltrinelliUserProfile(req: Request, res: Response) {
  try {
    const schema = z.object({
      user_id: z.string().uuid(),
      username: z.string().optional(),
      email: z.string().email().optional(),
      avatar_url: z.string().optional()
    });

    const validatedData = schema.parse(req.body);
    const { user_id, username, email, avatar_url } = validatedData;

    // Verifica se esiste già
    const { data: existingProfile, error } = await supabase
      .from('flt_users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existingProfile) {
      // Il profilo esiste già, restituisci l'ID
      return res.json({
        success: true,
        message: "User profile already exists",
        profile_id: existingProfile.id
      });
    }

    // Crea un nuovo profilo
    const { data: insertedProfile, error: insertError } = await supabase
      .from('flt_users')
      .insert({
        id: crypto.randomUUID(),
        user_id: user_id,
        username: username || `user_${user_id.substring(0, 8)}`,
        email: email,
        avatar_url: avatar_url
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting user profile:", insertError);
      return res.status(500).json({ error: "Failed to import user profile" });
    }

    return res.status(201).json({
      success: true,
      message: "User profile created successfully",
      profile_id: insertedProfile.id
    });
  } catch (error) {
    console.error("Error importing Feltrinelli user profile:", error);
    return res.status(500).json({ error: "Failed to import user profile" });
  }
}

// Inizializzazione tabelle
export async function initFeltrinelliTables() {
  try {
    console.log("Verifica connessione a Supabase");
    
    // Verifica se Supabase è disponibile
    if (!supabase || typeof supabase.from !== 'function') {
      console.warn("Supabase non disponibile");
      return;
    }
    
    // Imposta un timeout per le operazioni Supabase
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout connecting to Supabase')), 3000);
    });
    
    try {
      // Verifica veloce della connessione a Supabase
      const result = await Promise.race([
        supabase.from('flt_games').select('count').limit(1),
        timeoutPromise
      ]);
      
      // Se arriviamo qui, significa che la query è stata completata prima del timeout
      const { error } = result as { data: any, error: any };
      
      if (error) {
        console.warn("[Supabase] Connection error:", error.message);
        return;
      }
      
      console.log("[Supabase] Connessione verificata, tabelle già inizializzate");
      return; // Termina qui senza tentare di inizializzare le tabelle
    } catch (timeoutError) {
      console.warn("[Supabase] Connection timeout");
      return;
    }
  } catch (error) {
    console.error("Errore durante la verifica della connessione:", error);
  }
}


// Funzione per ottenere i premi disponibili
export async function getAvailableRewards(req: Request, res: Response) {
  try {
    const { gameId, period = 'all_time' } = req.query;
    
    if (!gameId) {
      return res.status(400).json({ error: 'gameId query parameter is required' });
    }
    
    // Verifica che il periodo sia valido
    if (!['all_time', 'monthly', 'weekly'].includes(period as string)) {
      return res.status(400).json({ error: 'period must be one of: all_time, monthly, weekly' });
    }
    
    // Query per ottenere i premi disponibili dalla tabella flt_rewards
    const { data, error } = await supabase
      .from('flt_rewards')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true) // Usando is_active invece di active
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching available rewards:', error);
      return res.status(500).json({ error: 'Failed to fetch available rewards' });
    }
    
    // Formatta i risultati includendo i campi aggiuntivi
    const rewards = data?.map(reward => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      rank: reward.rank || 0,
      points_required: reward.points_required || 0,
      image_url: reward.image_url || null,
      type: reward.type,
      value: reward.value,
      icon: reward.icon,
      color: reward.color,
      start_date: reward.start_date || null,
      end_date: reward.end_date || null,
      created_at: reward.created_at,
      updated_at: reward.updated_at
    })) || [];
    
    res.json(rewards);
  } catch (error) {
    console.error('Error in getAvailableRewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Funzione per ottenere i premi di un utente
export async function getUserRewards(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required' });
    }
    
    // Query per ottenere i premi dell'utente dalla tabella flt_user_rewards
    const { data, error } = await supabase
      .from('flt_user_rewards')
      .select(`
        *,
        flt_rewards (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user rewards:', error);
      return res.status(500).json({ error: 'Failed to fetch user rewards' });
    }
    
    // Formatta i risultati includendo i campi aggiuntivi
    const rewards = data?.map(record => {
      const reward = record.flt_rewards;
      return {
        id: reward.id,
        name: reward.name,
        description: reward.description,
        type: reward.type,
        value: reward.value,
        icon: reward.icon,
        color: reward.color,
        image_url: reward.image_url || null,
        start_date: reward.start_date || null,
        end_date: reward.end_date || null,
        is_active: reward.is_active,
        game_id: record.game_id,
        awarded_at: record.claimed_at || record.created_at,
        created_at: reward.created_at,
        updated_at: reward.updated_at
      };
    }) || [];
    
    res.json(rewards);
  } catch (error) {
    console.error('Error in getUserRewards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}