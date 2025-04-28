import express from 'express';
import { db } from '../db';
import { verifyClientToken } from '../middleware/auth';
import { supabase } from '../supabase';

// Create router
const router = express.Router();

// Endpoint per recuperare i giochi attivi per un client specifico
router.get('/client/games', verifyClientToken, async (req, res) => {
  try {
    console.log('[API Games] Client autenticato:', req.client);
    
    if (!req.client || !req.client.clientId) {
      console.error('[API Games] Client ID non trovato nella richiesta');
      return res.status(401).json({ error: 'Client non autenticato correttamente' });
    }
    
    const clientId = req.client.clientId;
    console.log('[API Games] Recupero giochi per clientId:', clientId);
    
    // Utilizziamo il nome corretto della tabella: flt_games
    try {
      const { data: games, error } = await supabase
        .from('flt_games')
        .select('id, name, description, feltrinelli_id, image_url')
        .eq('is_active', true)
        .order('name');
      
      if (error) {
        console.error('[API Games] Errore query tabella flt_games:', error);
        throw error;
      }
      
      console.log('[API Games] Numero giochi trovati:', games ? games.length : 0);
      
      // Mappiamo i campi per mantenere la compatibilità con il formato atteso dal client
      const formattedGames = games?.map(game => {
        // Costruisci URL completo per le immagini se è presente un image_url
        let imageUrl = game.image_url;
        if (imageUrl && !imageUrl.startsWith('http')) {
          // Se l'immagine è su Supabase Storage
          const { data } = supabase.storage
            .from('game-images')
            .getPublicUrl(imageUrl);
          imageUrl = data.publicUrl;
        }
        
        return {
          id: game.id,
          name: game.name,
          description: game.description,
          image_url: imageUrl,
          feltrinelli_game_id: game.feltrinelli_id
        };
      }) || [];
      
      res.json({ 
        data: formattedGames
      });
    } catch (supabaseError) {
      console.error('[API Games] Errore Supabase:', supabaseError);
      res.status(500).json({ 
        error: 'Errore durante il recupero dei giochi',
        details: supabaseError instanceof Error ? supabaseError.message : 'Errore accesso al database'
      });
    }
  } catch (error) {
    console.error('[API Games] Errore durante il recupero dei giochi:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero dei giochi',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Aggiungiamo un endpoint per caricare immagini per i giochi
router.post('/client/games/:gameId/image', verifyClientToken, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { imageData, fileName } = req.body;
    
    if (!imageData || !fileName) {
      return res.status(400).json({ error: 'Dati immagine mancanti' });
    }
    
    // Verifica che il gioco esista
    const { data: game, error: gameError } = await supabase
      .from('flt_games')
      .select('id')
      .eq('id', gameId)
      .single();
    
    if (gameError || !game) {
      return res.status(404).json({ error: 'Gioco non trovato' });
    }
    
    // Decodifica l'immagine da base64
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Carica l'immagine su Supabase Storage
    const filePath = `games/${gameId}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('game-images')
      .upload(filePath, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) {
      console.error('[API Games] Errore caricamento immagine:', uploadError);
      return res.status(500).json({ 
        error: 'Errore durante il caricamento dell\'immagine',
        details: uploadError.message
      });
    }
    
    // Aggiorna il record del gioco con il nuovo URL dell'immagine
    const { error: updateError } = await supabase
      .from('flt_games')
      .update({ image_url: filePath })
      .eq('id', gameId);
    
    if (updateError) {
      console.error('[API Games] Errore aggiornamento URL immagine:', updateError);
      return res.status(500).json({ 
        error: 'Errore durante l\'aggiornamento del gioco',
        details: updateError.message
      });
    }
    
    // Ottieni l'URL pubblico dell'immagine
    const { data } = supabase.storage
      .from('game-images')
      .getPublicUrl(filePath);
    
    res.json({ 
      success: true,
      imageUrl: data.publicUrl
    });
  } catch (error) {
    console.error('[API Games] Errore durante il caricamento dell\'immagine:', error);
    res.status(500).json({ 
      error: 'Errore durante il caricamento dell\'immagine',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Endpoint per recuperare le impostazioni di un gioco specifico
router.get('/client/games/:gameId/settings', verifyClientToken, async (req, res) => {
  try {
    console.log('[API Game Settings] Client autenticato:', req.client);
    
    if (!req.client || !req.client.clientId) {
      console.error('[API Game Settings] Client ID non trovato nella richiesta');
      return res.status(401).json({ error: 'Client non autenticato correttamente' });
    }
    
    const { gameId } = req.params;
    console.log(`[API Game Settings] Recupero impostazioni per gameId: ${gameId}`);
    
    // Verifica che il gioco esista e sia attivo
    const { data: game, error: gameError } = await supabase
      .from('flt_games')
      .select('id, name')
      .eq('id', gameId)
      .eq('is_active', true)
      .single();
    
    if (gameError || !game) {
      console.error('[API Game Settings] Gioco non trovato o non attivo:', gameError);
      return res.status(404).json({ error: 'Gioco non trovato o non attivo' });
    }
    
    // Recupera le impostazioni del gioco
    const { data: settings, error: settingsError } = await supabase
      .from('flt_game_settings')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true)
      .single();
    
    if (settingsError) {
      console.error('[API Game Settings] Errore recupero impostazioni:', settingsError);
      return res.status(500).json({ 
        error: 'Errore durante il recupero delle impostazioni del gioco',
        details: settingsError.message
      });
    }
    
    if (!settings) {
      console.error('[API Game Settings] Nessuna impostazione trovata per il gioco');
      return res.status(404).json({ error: 'Impostazioni del gioco non trovate' });
    }
    
    console.log(`[API Game Settings] Impostazioni trovate per il gioco ${game.name}:`, settings);
    
    // Formatta la risposta
    const formattedSettings = {
      id: settings.id,
      game_id: settings.game_id,
      timer_duration: settings.timer_duration,
      question_count: settings.question_count,
      difficulty: settings.difficulty,
      weekly_leaderboard: settings.weekly_leaderboard,
      monthly_leaderboard: settings.monthly_leaderboard,
      game_type: settings.game_type
    };
    
    res.json({ 
      data: formattedSettings
    });
  } catch (error) {
    console.error('[API Game Settings] Errore durante il recupero delle impostazioni:', error);
    res.status(500).json({ 
      error: 'Errore durante il recupero delle impostazioni del gioco',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Export the router
export default router;