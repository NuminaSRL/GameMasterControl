import { Request, Response } from "express";
import { 
  Game, FltGame, FltGameSession, InsertFltGameSession, 
  FltUserProfile, InsertFltUserProfile, 
  FltLeaderboard, FltUserReward
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";
import { 
  fltGameSessions, fltGames, fltUserProfiles, 
  fltLeaderboard, fltUserRewards, fltAnswerOptions,
  games, rewards
} from "@shared/schema";
import { supabase } from "./supabase";
import { z } from "zod";

// TIPI PER LE API

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
    const userProfile = await db.query.fltUserProfiles.findFirst({
      where: eq(fltUserProfiles.userId, user_id)
    });

    if (!userProfile) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verifica che il gioco esista e sia mappato
    const gameMapping = await db.query.fltGames.findFirst({
      where: eq(fltGames.feltrinelliId, game_id)
    });

    if (!gameMapping) {
      return res.status(404).json({ error: "Game not found" });
    }

    // Verifica che il gioco interno sia attivo
    const internalGame = await db.query.games.findFirst({
      where: and(
        eq(games.id, gameMapping.internalId),
        eq(games.isActive, true)
      )
    });

    if (!internalGame) {
      return res.status(403).json({ error: "Game is not active" });
    }

    // Crea una nuova sessione
    const sessionId = crypto.randomUUID();
    const newSession: InsertFltGameSession = {
      id: crypto.randomUUID(),
      sessionId,
      userId: user_id,
      gameId: game_id,
      internalGameId: gameMapping.internalId,
      score: 0,
      completed: false
    };

    const [insertedSession] = await db.insert(fltGameSessions)
      .values(newSession)
      .returning();

    // Formatta la risposta come previsto dall'API Feltrinelli
    const response: GameSessionResponse = {
      session_id: insertedSession.sessionId,
      user_id: insertedSession.userId,
      game_id: insertedSession.gameId,
      created_at: insertedSession.createdAt.toISOString(),
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
    
    // Recupera il gioco interno per il tipo "books"
    const bookGame = await db.query.games.findFirst({
      where: and(
        eq(games.gameType, "books"),
        eq(games.isActive, true),
        eq(games.difficulty, difficulty)
      )
    });

    if (!bookGame) {
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
    // Normalmente salveremmo queste informazioni nel database
    const correctOptionId = question.options[1].id; // 1984 è la risposta corretta
    
    for (const option of question.options) {
      await db.insert(fltAnswerOptions).values({
        id: option.id,
        questionId,
        bookId: option.id, // Usiamo lo stesso ID come book ID per semplicità
        isCorrect: option.id === correctOptionId
      });
    }

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
    const session = await db.query.fltGameSessions.findFirst({
      where: eq(fltGameSessions.sessionId, session_id)
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Verifica la risposta
    const answerOption = await db.query.fltAnswerOptions.findFirst({
      where: and(
        eq(fltAnswerOptions.id, answer_option_id),
        eq(fltAnswerOptions.questionId, question_id)
      )
    });

    if (!answerOption) {
      return res.status(404).json({ error: "Answer option not found" });
    }

    // Calcoliamo i punti in base alla correttezza e al tempo
    let points = 0;
    if (answerOption.isCorrect) {
      // Punteggio base per risposta corretta
      points = 1;
      
      // Bonus per risposta veloce (sotto i 5 secondi)
      if (time_taken < 5) {
        points += 1;
      }
    }

    // Aggiorniamo il punteggio della sessione
    await db.update(fltGameSessions)
      .set({ 
        score: session.score + points
      })
      .where(eq(fltGameSessions.id, session.id));

    // Rispondiamo con il risultato
    return res.json({
      is_correct: answerOption.isCorrect,
      message: answerOption.isCorrect ? "Risposta corretta!" : "Risposta errata!",
      points
    });
  } catch (error) {
    console.error("Error submitting book quiz answer:", error);
    return res.status(500).json({ error: "Failed to submit answer" });
  }
}

// LEADERBOARD

export async function getLeaderboard(req: Request, res: Response) {
  try {
    const period = (req.query.period as string) || "all_time";
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboardEntries = await db.query.fltLeaderboard.findMany({
      where: eq(fltLeaderboard.period, period),
      orderBy: [desc(fltLeaderboard.points)],
      limit
    });

    const formattedEntries: LeaderboardEntry[] = await Promise.all(
      leaderboardEntries.map(async entry => {
        // Recupera le informazioni utente
        const userProfile = await db.query.fltUserProfiles.findFirst({
          where: eq(fltUserProfiles.userId, entry.userId)
        });

        return {
          id: entry.id.toString(),
          user_id: entry.userId,
          game_id: entry.gameId,
          points: entry.points,
          users: {
            username: userProfile?.username || "Unknown",
            avatar_url: userProfile?.avatarUrl || null
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

export async function getGameLeaderboard(req: Request, res: Response) {
  try {
    const gameId = req.params.gameId;
    const period = (req.query.period as string) || "all_time";
    const limit = parseInt(req.query.limit as string) || 10;

    const leaderboardEntries = await db.query.fltLeaderboard.findMany({
      where: and(
        eq(fltLeaderboard.gameId, gameId),
        eq(fltLeaderboard.period, period)
      ),
      orderBy: [desc(fltLeaderboard.points)],
      limit
    });

    const formattedEntries: LeaderboardEntry[] = await Promise.all(
      leaderboardEntries.map(async entry => {
        // Recupera le informazioni utente
        const userProfile = await db.query.fltUserProfiles.findFirst({
          where: eq(fltUserProfiles.userId, entry.userId)
        });

        return {
          id: entry.id.toString(),
          user_id: entry.userId,
          game_id: entry.gameId,
          points: entry.points,
          users: {
            username: userProfile?.username || "Unknown",
            avatar_url: userProfile?.avatarUrl || null
          }
        };
      })
    );

    return res.json({ data: formattedEntries });
  } catch (error) {
    console.error("Error getting game leaderboard:", error);
    return res.status(500).json({ error: "Failed to get game leaderboard" });
  }
}

export async function submitScore(req: Request, res: Response) {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      gameId: z.string().uuid(),
      correctAnswers: z.number(),
      totalQuestions: z.number(),
      sessionId: z.string().uuid()
    });

    const validatedData = schema.parse(req.body);
    const { userId, gameId, correctAnswers, totalQuestions, sessionId } = validatedData;

    // Verifica che la sessione esista
    const session = await db.query.fltGameSessions.findFirst({
      where: eq(fltGameSessions.sessionId, sessionId)
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Calcola il punteggio finale
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Aggiorna la sessione
    await db.update(fltGameSessions)
      .set({ 
        score: finalScore,
        completed: true,
        updatedAt: new Date()
      })
      .where(eq(fltGameSessions.id, session.id));

    // Aggiorna il punteggio nella leaderboard
    const existingEntry = await db.query.fltLeaderboard.findFirst({
      where: and(
        eq(fltLeaderboard.userId, userId),
        eq(fltLeaderboard.gameId, gameId),
        eq(fltLeaderboard.period, "all_time")
      )
    });

    if (existingEntry) {
      // Aggiorna solo se il nuovo punteggio è migliore
      if (finalScore > existingEntry.points) {
        await db.update(fltLeaderboard)
          .set({ 
            points: finalScore,
            updatedAt: new Date()
          })
          .where(eq(fltLeaderboard.id, existingEntry.id));
      }
    } else {
      // Crea un nuovo record
      await db.insert(fltLeaderboard).values({
        userId,
        gameId,
        internalGameId: session.internalGameId,
        points: finalScore,
        period: "all_time"
      });
    }

    return res.json({
      success: true,
      message: "Punteggio aggiornato con successo"
    });
  } catch (error) {
    console.error("Error submitting score:", error);
    return res.status(500).json({ error: "Failed to submit score" });
  }
}

export async function submitScoreAllPeriods(req: Request, res: Response) {
  try {
    const schema = z.object({
      userId: z.string().uuid(),
      gameId: z.string().uuid(),
      correctAnswers: z.number(),
      totalQuestions: z.number(),
      sessionId: z.string().uuid()
    });

    const validatedData = schema.parse(req.body);
    const { userId, gameId, correctAnswers, totalQuestions, sessionId } = validatedData;

    // Verifica che la sessione esista
    const session = await db.query.fltGameSessions.findFirst({
      where: eq(fltGameSessions.sessionId, sessionId)
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Calcola il punteggio finale
    const finalScore = Math.round((correctAnswers / totalQuestions) * 100);

    // Aggiorna la sessione
    await db.update(fltGameSessions)
      .set({ 
        score: finalScore,
        completed: true,
        updatedAt: new Date()
      })
      .where(eq(fltGameSessions.id, session.id));

    // Ottieni il gioco interno associato
    const internalGame = await db.query.games.findFirst({
      where: eq(games.id, session.internalGameId)
    });

    if (!internalGame) {
      return res.status(404).json({ error: "Internal game not found" });
    }

    // Periodi da aggiornare
    const periods = ["all_time"];
    if (internalGame.weeklyLeaderboard) periods.push("weekly");
    if (internalGame.monthlyLeaderboard) periods.push("monthly");

    // Aggiorna tutti i periodi richiesti
    for (const period of periods) {
      const existingEntry = await db.query.fltLeaderboard.findFirst({
        where: and(
          eq(fltLeaderboard.userId, userId),
          eq(fltLeaderboard.gameId, gameId),
          eq(fltLeaderboard.period, period)
        )
      });

      if (existingEntry) {
        // Aggiorna solo se il nuovo punteggio è migliore
        if (finalScore > existingEntry.points) {
          await db.update(fltLeaderboard)
            .set({ 
              points: finalScore,
              updatedAt: new Date()
            })
            .where(eq(fltLeaderboard.id, existingEntry.id));
        }
      } else {
        // Crea un nuovo record
        await db.insert(fltLeaderboard).values({
          userId,
          gameId,
          internalGameId: session.internalGameId,
          points: finalScore,
          period
        });
      }
    }

    return res.json({
      success: true,
      message: "Punteggio aggiornato per tutti i periodi"
    });
  } catch (error) {
    console.error("Error submitting score for all periods:", error);
    return res.status(500).json({ error: "Failed to submit score for all periods" });
  }
}

// REWARDS

export async function getAvailableRewards(req: Request, res: Response) {
  try {
    const gameId = req.query.game_id as string;
    const period = req.query.period as string || "all_time";

    if (!gameId) {
      return res.status(400).json({ error: "Game ID is required" });
    }

    // Ottieni il gioco interno associato
    const gameMapping = await db.query.fltGames.findFirst({
      where: eq(fltGames.feltrinelliId, gameId)
    });

    if (!gameMapping) {
      return res.status(404).json({ error: "Game not found" });
    }

    // Recupera i premi disponibili per questo gioco
    const availableRewards = await db.query.rewards.findMany({
      where: or(
        eq(rewards.gameType, "books"),  // Per semplificare, includiamo tutti i tipi di gioco
        eq(rewards.gameType, "authors"),
        eq(rewards.gameType, "years")
      )
    });

    // Formatta i premi per la risposta
    const formattedRewards: RewardItem[] = availableRewards.map((reward, index) => ({
      id: reward.id.toString(),
      name: reward.name,
      description: reward.description,
      image_url: reward.originalImageUrl || reward.imageUrl || "",
      points_required: reward.pointsRequired,
      rank: reward.rank || index + 1
    }));

    return res.json({
      success: true,
      rewards: formattedRewards
    });
  } catch (error) {
    console.error("Error getting available rewards:", error);
    return res.status(500).json({ error: "Failed to get available rewards" });
  }
}

export async function getUserRewards(req: Request, res: Response) {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Recupera i premi dell'utente
    const userRewards = await db.query.fltUserRewards.findMany({
      where: eq(fltUserRewards.userId, userId),
      with: {
        reward: true,
        game: true
      }
    });

    // Formatta i premi per la risposta
    const formattedRewards = userRewards.map(userReward => ({
      id: userReward.id.toString(),
      user_id: userReward.userId,
      reward_id: userReward.rewardId.toString(),
      game_id: userReward.gameId,
      period: userReward.period,
      rank: userReward.rank,
      claimed_at: userReward.claimedAt.toISOString(),
      rewards: {
        name: userReward.reward.name,
        description: userReward.reward.description,
        image_url: userReward.reward.originalImageUrl || userReward.reward.imageUrl || ""
      }
    }));

    return res.json({
      success: true,
      rewards: formattedRewards
    });
  } catch (error) {
    console.error("Error getting user rewards:", error);
    return res.status(500).json({ error: "Failed to get user rewards" });
  }
}

// IMPORTAZIONE DATI FELTRINELLI

export async function importFeltrinelliUserProfile(req: Request, res: Response) {
  try {
    const schema = z.object({
      user_id: z.string().uuid(),
      username: z.string(),
      email: z.string().email(),
      avatar_url: z.string().optional()
    });

    const validatedData = schema.parse(req.body);
    const { user_id, username, email, avatar_url } = validatedData;

    // Verifica se l'utente esiste già
    const existingProfile = await db.query.fltUserProfiles.findFirst({
      where: eq(fltUserProfiles.userId, user_id)
    });

    if (existingProfile) {
      // Aggiorna il profilo esistente
      await db.update(fltUserProfiles)
        .set({ 
          username,
          email,
          avatarUrl: avatar_url,
          updatedAt: new Date()
        })
        .where(eq(fltUserProfiles.id, existingProfile.id));

      return res.json({
        success: true,
        message: "User profile updated successfully",
        profile_id: existingProfile.id
      });
    }

    // Crea un nuovo profilo
    const newProfile: InsertFltUserProfile = {
      id: crypto.randomUUID(),
      userId: user_id,
      username,
      email,
      avatarUrl: avatar_url
    };

    const [insertedProfile] = await db.insert(fltUserProfiles)
      .values(newProfile)
      .returning();

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
    console.log("Inizializzazione tabelle Feltrinelli");
    
    // Verifica se non ci sono giochi mappati e crea mappature predefinite
    const existingMappings = await db.query.fltGames.findMany();
    
    if (existingMappings.length === 0) {
      console.log("Creazione mappature predefinite per i giochi Feltrinelli");
      
      // Recupera i giochi interni
      const internalGames = await db.query.games.findMany({
        where: eq(games.isActive, true)
      });
      
      // Mappatura predefinita tra gli ID Feltrinelli e i nostri giochi
      const defaultMappings = [
        {
          feltrinelliId: "00000000-0000-0000-0000-000000000001",
          gameType: "books",
          name: "IndovinaLibro"
        },
        {
          feltrinelliId: "00000000-0000-0000-0000-000000000002",
          gameType: "authors",
          name: "Indovina l'Autore"
        },
        {
          feltrinelliId: "00000000-0000-0000-0000-000000000003",
          gameType: "years",
          name: "Indovina l'Anno"
        }
      ];
      
      for (const mapping of defaultMappings) {
        // Cerca il gioco interno corrispondente
        const internalGame = internalGames.find(g => 
          g.gameType === mapping.gameType || 
          g.name.toLowerCase().includes(mapping.name.toLowerCase())
        );
        
        if (internalGame) {
          // Crea la mappatura
          await db.insert(fltGames).values({
            id: crypto.randomUUID(),
            feltrinelliId: mapping.feltrinelliId,
            internalId: internalGame.id,
            name: internalGame.name,
            description: internalGame.description,
            isActive: internalGame.isActive
          });
          
          console.log(`Mappatura creata: ${mapping.name} -> ID interno: ${internalGame.id}`);
        } else {
          console.log(`Nessun gioco interno trovato per: ${mapping.name}`);
        }
      }
    }
    
    console.log("Inizializzazione completata");
  } catch (error) {
    console.error("Errore durante l'inizializzazione delle tabelle Feltrinelli:", error);
  }
}