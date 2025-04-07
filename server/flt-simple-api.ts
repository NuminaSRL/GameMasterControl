import { Request, Response } from "express";
import { db } from "./db";
import { supabase } from "./supabase";
import { flt_games, flt_rewards, flt_users, gameSettings, insertFLTGameSchema, insertFLTRewardSchema, insertFLTUserSchema, insertGameSettingsSchema, FLTGame, FLTReward, FLTUser, GameSettings } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

// ===== API per tabella flt_users =====

// GET: Recupera tutti gli utenti
export async function getAllFLTUsers(req: Request, res: Response) {
  try {
    const { data: users, error } = await supabase
      .from('flt_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.json(users);
  } catch (error) {
    console.error("Error getting users:", error);
    return res.status(500).json({ error: "Failed to get users" });
  }
}

// GET: Recupera un utente specifico
export async function getFLTUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const { data: user, error } = await supabase
      .from('flt_users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        return res.status(404).json({ error: "User not found" });
      }
      throw error;
    }
    
    return res.json(user);
  } catch (error) {
    console.error("Error getting user:", error);
    return res.status(500).json({ error: "Failed to get user" });
  }
}

// POST: Crea/Importa un nuovo utente
export async function createFLTUser(req: Request, res: Response) {
  try {
    const { user_id } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ error: "Missing required field: user_id" });
    }

    // Verifica se esiste già
    const { data: existingUser, error } = await supabase
      .from('flt_users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existingUser) {
      // L'utente esiste già
      return res.json({
        success: true,
        message: "User already exists",
        user_id: existingUser.id
      });
    }

    // Prepara i dati validati
    const validatedData = insertFLTUserSchema.parse({
      userId: user_id,
      active: true
    });

    // Crea un nuovo utente
    const { data: newUser, error: insertError } = await supabase
      .from('flt_users')
      .insert([validatedData])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      user_id: newUser.id
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
}

// ===== API per tabella flt_games =====

// GET: Recupera tutti i giochi
export async function getAllFLTGames(req: Request, res: Response) {
  try {
    const { data: games, error } = await supabase
      .from('flt_games')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.json(games);
  } catch (error) {
    console.error("Error getting games:", error);
    return res.status(500).json({ error: "Failed to get games" });
  }
}

// GET: Recupera un gioco specifico
export async function getFLTGame(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const { data: game, error } = await supabase
      .from('flt_games')
      .select('*, flt_game_settings(*)') // include le impostazioni del gioco
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        return res.status(404).json({ error: "Game not found" });
      }
      throw error;
    }
    
    return res.json(game);
  } catch (error) {
    console.error("Error getting game:", error);
    return res.status(500).json({ error: "Failed to get game" });
  }
}

// POST: Crea un nuovo gioco
export async function createFLTGame(req: Request, res: Response) {
  try {
    const validatedData = insertFLTGameSchema.parse(req.body);
    
    // Genera un UUID per il nuovo gioco
    const gameId = crypto.randomUUID();
    
    // Crea il gioco
    const { data: game, error } = await supabase
      .from('flt_games')
      .insert([{
        ...validatedData
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Se sono fornite le impostazioni del gioco, le salviamo
    if (req.body.settings) {
      const settingsData = insertGameSettingsSchema.parse({
        gameId: game.id, // Usiamo l'ID del gioco appena creato
        timeDuration: req.body.settings.timeDuration || 30,
        questionCount: req.body.settings.questionCount || 5
      });
      
      const { error: settingsError } = await supabase
        .from('flt_game_settings')
        .insert([settingsData]);
      
      if (settingsError) throw settingsError;
    }
    
    return res.status(201).json({
      success: true,
      message: "Game created successfully",
      game: game
    });
  } catch (error) {
    console.error("Error creating game:", error);
    return res.status(500).json({ error: "Failed to create game" });
  }
}

// PATCH: Aggiorna un gioco esistente
export async function updateFLTGame(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    // Aggiorna il gioco
    const { data: updatedGame, error } = await supabase
      .from('flt_games')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;

    // Se sono fornite le impostazioni, le aggiorniamo
    if (data.settings) {
      const { data: existingSettings } = await supabase
        .from('flt_game_settings')
        .select('*')
        .eq('game_id', id)
        .single();
      
      if (existingSettings) {
        // Aggiorna le impostazioni esistenti
        const { error: settingsError } = await supabase
          .from('flt_game_settings')
          .update({
            timeDuration: data.settings.timeDuration,
            questionCount: data.settings.questionCount
          })
          .eq('game_id', id);
        
        if (settingsError) throw settingsError;
      } else {
        // Crea nuove impostazioni
        const validatedData = insertGameSettingsSchema.parse({
          gameId: id,
          timeDuration: data.settings.timeDuration || 30,
          questionCount: data.settings.questionCount || 5
        });
        
        const { error: settingsError } = await supabase
          .from('flt_game_settings')
          .insert([validatedData]);
        
        if (settingsError) throw settingsError;
      }
    }
    
    return res.json({
      success: true,
      message: "Game updated successfully",
      game: updatedGame
    });
  } catch (error) {
    console.error("Error updating game:", error);
    return res.status(500).json({ error: "Failed to update game" });
  }
}

// DELETE: Disattiva un gioco (non lo elimina fisicamente)
export async function toggleFLTGameStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Recupera lo stato attuale
    const { data: game, error: getError } = await supabase
      .from('flt_games')
      .select('active')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    // Inverte lo stato
    const newStatus = !game.active;
    
    // Aggiorna il gioco
    const { data: updatedGame, error } = await supabase
      .from('flt_games')
      .update({ active: newStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.json({
      success: true,
      message: `Game ${newStatus ? 'activated' : 'deactivated'} successfully`,
      game: updatedGame
    });
  } catch (error) {
    console.error("Error toggling game status:", error);
    return res.status(500).json({ error: "Failed to toggle game status" });
  }
}

// ===== API per tabella flt_game_settings =====

// GET: Recupera le impostazioni di un gioco
export async function getGameSettings(req: Request, res: Response) {
  try {
    const { gameId } = req.params;
    
    const { data: settings, error } = await supabase
      .from('flt_game_settings')
      .select('*')
      .eq('game_id', gameId)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        return res.status(404).json({ error: "Game settings not found" });
      }
      throw error;
    }
    
    return res.json(settings);
  } catch (error) {
    console.error("Error getting game settings:", error);
    return res.status(500).json({ error: "Failed to get game settings" });
  }
}

// POST/PUT: Crea o aggiorna le impostazioni di un gioco
export async function saveGameSettings(req: Request, res: Response) {
  try {
    const { gameId } = req.params;
    const data = req.body;
    
    // Verifica se il gioco esiste
    const { data: game, error: gameError } = await supabase
      .from('flt_games')
      .select('id')
      .eq('id', gameId)
      .single();
    
    if (gameError) {
      if (gameError.message.includes('No rows found')) {
        return res.status(404).json({ error: "Game not found" });
      }
      throw gameError;
    }
    
    // Verifica se esistono già impostazioni per questo gioco
    const { data: existingSettings, error: settingsError } = await supabase
      .from('flt_game_settings')
      .select('*')
      .eq('game_id', gameId)
      .single();
    
    if (existingSettings) {
      // Aggiorna le impostazioni esistenti
      const { data: updatedSettings, error } = await supabase
        .from('flt_game_settings')
        .update({
          timeDuration: data.timeDuration,
          questionCount: data.questionCount,
          active: data.active !== undefined ? data.active : true
        })
        .eq('game_id', gameId)
        .select()
        .single();
      
      if (error) throw error;
      
      return res.json({
        success: true,
        message: "Game settings updated successfully",
        settings: updatedSettings
      });
    } else {
      // Crea nuove impostazioni
      const validatedData = insertGameSettingsSchema.parse({
        gameId: gameId,
        timeDuration: data.timeDuration || 30,
        questionCount: data.questionCount || 5,
        active: data.active !== undefined ? data.active : true
      });
      
      const { data: newSettings, error } = await supabase
        .from('flt_game_settings')
        .insert([validatedData])
        .select()
        .single();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        message: "Game settings created successfully",
        settings: newSettings
      });
    }
  } catch (error) {
    console.error("Error saving game settings:", error);
    return res.status(500).json({ error: "Failed to save game settings" });
  }
}

// ===== API per tabella flt_rewards =====

// GET: Recupera tutti i premi
export async function getAllFLTRewards(req: Request, res: Response) {
  try {
    const { data: rewards, error } = await supabase
      .from('flt_rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return res.json(rewards);
  } catch (error) {
    console.error("Error getting rewards:", error);
    return res.status(500).json({ error: "Failed to get rewards" });
  }
}

// GET: Recupera i premi di un gioco specifico
export async function getGameFLTRewards(req: Request, res: Response) {
  try {
    const { gameId } = req.params;
    
    const { data: rewards, error } = await supabase
      .from('flt_rewards')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.json(rewards);
  } catch (error) {
    console.error("Error getting game rewards:", error);
    return res.status(500).json({ error: "Failed to get game rewards" });
  }
}

// GET: Recupera un premio specifico
export async function getFLTReward(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const { data: reward, error } = await supabase
      .from('flt_rewards')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        return res.status(404).json({ error: "Reward not found" });
      }
      throw error;
    }
    
    return res.json(reward);
  } catch (error) {
    console.error("Error getting reward:", error);
    return res.status(500).json({ error: "Failed to get reward" });
  }
}

// POST: Crea un nuovo premio
export async function createFLTReward(req: Request, res: Response) {
  try {
    const validatedData = insertFLTRewardSchema.parse(req.body);
    
    const { data: reward, error } = await supabase
      .from('flt_rewards')
      .insert([validatedData])
      .select()
      .single();
    
    if (error) throw error;
    
    return res.status(201).json({
      success: true,
      message: "Reward created successfully",
      reward: reward
    });
  } catch (error) {
    console.error("Error creating reward:", error);
    return res.status(500).json({ error: "Failed to create reward" });
  }
}

// PATCH: Aggiorna un premio esistente
export async function updateFLTReward(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const { data: updatedReward, error } = await supabase
      .from('flt_rewards')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.json({
      success: true,
      message: "Reward updated successfully",
      reward: updatedReward
    });
  } catch (error) {
    console.error("Error updating reward:", error);
    return res.status(500).json({ error: "Failed to update reward" });
  }
}

// DELETE: Disattiva un premio
export async function toggleFLTRewardStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Recupera lo stato attuale
    const { data: reward, error: getError } = await supabase
      .from('flt_rewards')
      .select('active')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    // Inverte lo stato
    const newStatus = !reward.active;
    
    // Aggiorna il premio
    const { data: updatedReward, error } = await supabase
      .from('flt_rewards')
      .update({ active: newStatus })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return res.json({
      success: true,
      message: `Reward ${newStatus ? 'activated' : 'deactivated'} successfully`,
      reward: updatedReward
    });
  } catch (error) {
    console.error("Error toggling reward status:", error);
    return res.status(500).json({ error: "Failed to toggle reward status" });
  }
}