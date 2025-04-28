import express from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { supabase } from '../supabase';

// Assicurati che queste variabili siano definite
const router = express.Router();

// Configurazione token
const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '7d'; // Token valido per 7 giorni invece di 24 ore
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '30d'; // Refresh token valido per 30 giorni

// Endpoint per l'autenticazione server-to-server con apiKey
router.post('/client/auth', async (req, res) => {
  console.log('[API] Richiesta di autenticazione client ricevuta:', req.body);
  try {
    const { clientId, apiKey } = req.body;
    
    // Converti clientId in intero se è una stringa
    const clientIdInt = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId;
    
    console.log('[API] Verifica credenziali per clientId:', clientIdInt);
    
    // Verifica che clientId sia un numero valido
    if (isNaN(clientIdInt)) {
      return res.status(400).json({ 
        error: 'ID client non valido',
        details: 'L\'ID client deve essere un numero intero'
      });
    }
    
    // Verifica che apiKey sia fornita
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'API key mancante',
        details: 'È necessario fornire una API key valida'
      });
    }
    
    // Utilizziamo direttamente l'API di Supabase come facciamo nell'endpoint di debug
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', clientIdInt)
        .eq('api_key', apiKey)
        .single();
        
      if (clientError || !clientData) {
        console.error('[API] Errore query client:', clientError);
        return res.status(401).json({ error: 'Credenziali client non valide' });
      }
      
      const client = clientData;
      
      // Genera un token JWT con scadenza più lunga
      const secretKey = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        JSON.stringify({ 
          clientId: client.id,
          clientName: client.name,
          type: 'client'
        }),
        secretKey
      );
      
      // Genera un refresh token con scadenza ancora più lunga
      const refreshSecretKey = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key';
      const refreshToken = jwt.sign(
        JSON.stringify({ 
          clientId: client.id,
          type: 'refresh'
        }),
        refreshSecretKey
      );
      
      // Salva il refresh token nel database usando Supabase
      const { error: insertError } = await supabase
        .from('refresh_tokens')
        .insert({
          client_id: client.id,
          token: refreshToken,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 giorni da ora
        });
        
      if (insertError) {
        console.error('[API] Errore salvataggio refresh token:', insertError);
        // Continuiamo comunque, il refresh token è meno critico
      }
      
      res.json({
        token,
        refreshToken,
        client: {
          id: client.id,
          name: client.name
        }
      });
    } catch (queryError) {
      console.error('[API] Errore durante l\'autenticazione:', queryError);
      return res.status(500).json({ 
        error: 'Errore durante l\'autenticazione',
        details: queryError instanceof Error ? queryError.message : 'Errore sconosciuto'
      });
    }
  } catch (error) {
    console.error('[API] Errore dettagliato durante l\'autenticazione del client:', error);
    res.status(500).json({ 
      error: 'Errore durante l\'autenticazione',
      details: error instanceof Error ? error.message : 'Errore sconosciuto'
    });
  }
});

// Nuovo endpoint per il refresh del token
router.post('/client/refresh-token', async (req, res) => {
  console.log('[API] Richiesta di refresh token ricevuta:', req.body);
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token mancante' });
    }
    
    // Verifica il refresh token
    let decoded: any;
    try {
      const refreshSecretKey = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'your-refresh-secret-key';
      decoded = jwt.verify(refreshToken, refreshSecretKey);
      
      // Se decoded è una stringa, convertiamolo in oggetto
      if (typeof decoded === 'string') {
        decoded = JSON.parse(decoded);
      }
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token non valido o scaduto' });
    }
    
    // Verifica che il token sia nel database e non sia stato revocato
    const tokenResult = await db.execute(`
      SELECT * FROM refresh_tokens 
      WHERE token = $1 AND client_id = $2 AND revoked = false AND expires_at > NOW()
    `, [refreshToken, decoded.clientId]);
    
    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token non trovato o revocato' });
    }
    
    // Ottieni le informazioni del client
    const clientResult = await db.execute(`
      SELECT id, name FROM clients WHERE id = $1
    `, [decoded.clientId]);
    
    if (clientResult.rows.length === 0) {
      return res.status(401).json({ error: 'Client non trovato' });
    }
    
    const client = clientResult.rows[0];
    
    // Genera un nuovo token JWT
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const newToken = jwt.sign(
      JSON.stringify({ 
        clientId: client.id,
        clientName: client.name,
        type: 'client'
      }),
      secretKey
    );
    
    res.json({
      token: newToken,
      client: {
        id: client.id,
        name: client.name
      }
    });
  } catch (error) {
    console.error('[API] Errore durante il refresh del token:', error);
    res.status(500).json({ error: 'Errore durante il refresh del token' });
  }
});

// Endpoint di test per verificare che il server risponda
router.get('/auth-test', (req, res) => {
  res.json({ message: 'Auth server is running' });
});

// Endpoint di debug per verificare l'esistenza del client
router.get('/debug/check-client/:clientId', async (req, res) => {
  try {
    const clientId = parseInt(req.params.clientId, 10); // Converti in intero
    
    console.log('[API Debug] Verifica client con ID:', clientId);
    
    // Verifica che clientId sia un numero valido
    if (isNaN(clientId)) {
      return res.status(400).json({ 
        error: 'ID client non valido',
        details: 'L\'ID client deve essere un numero intero'
      });
    }
    
    // Utilizziamo direttamente l'API di Supabase invece di passare attraverso db.execute
    try {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, name, api_key')
        .eq('id', clientId)
        .single();
        
      if (clientError) {
        console.error('[API Debug] Errore query client:', clientError);
        if (clientError.code === 'PGRST116') {
          return res.status(404).json({ error: 'Client non trovato' });
        }
        throw clientError;
      }
      
      // Nascondi parte della chiave API per sicurezza
      const apiKey = clientData.api_key;
      const maskedApiKey = apiKey ? 
        apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4) : 
        'non impostata';
      
      res.json({
        message: 'Client trovato',
        client: {
          id: clientData.id,
          name: clientData.name,
          api_key_preview: maskedApiKey
        }
      });
    } catch (queryError) {
      console.error('[API Debug] Errore query client:', queryError);
      return res.status(500).json({ 
        error: 'Errore query client',
        details: queryError instanceof Error ? queryError.message : JSON.stringify(queryError)
      });
    }
  } catch (error) {
    console.error('[API Debug] Errore generale:', error);
    res.status(500).json({ 
      error: 'Errore durante la verifica del client',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
});

// Endpoint di test semplice
router.get('/debug/simple-test', (req, res) => {
  res.json({ 
    message: 'Simple test endpoint is working',
    timestamp: new Date().toISOString()
  });
});

// Endpoint per verificare la struttura della tabella clients
router.get('/debug/table-structure/clients', async (req, res) => {
  try {
    console.log('[API Debug] Verifica struttura tabella clients...');
    
    // Verifica la struttura della tabella clients
    const structureQuery = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'clients'
      ORDER BY ordinal_position
    `);
    
    console.log('[API Debug] Struttura tabella clients:', JSON.stringify(structureQuery.rows));
    
    res.json({
      message: 'Struttura tabella clients',
      columns: structureQuery.rows
    });
  } catch (error) {
    console.error('[API Debug] Errore verifica struttura tabella:', error);
    res.status(500).json({ 
      error: 'Errore verifica struttura tabella',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
});

// Endpoint per verificare la struttura della tabella refresh_tokens
router.get('/debug/table-structure/refresh_tokens', async (req, res) => {
  try {
    console.log('[API Debug] Verifica struttura tabella refresh_tokens...');
    
    // Verifica la struttura della tabella refresh_tokens
    const structureQuery = await db.execute(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'refresh_tokens'
      ORDER BY ordinal_position
    `);
    
    console.log('[API Debug] Struttura tabella refresh_tokens:', JSON.stringify(structureQuery.rows));
    
    res.json({
      message: 'Struttura tabella refresh_tokens',
      columns: structureQuery.rows
    });
  } catch (error) {
    console.error('[API Debug] Errore verifica struttura tabella:', error);
    res.status(500).json({ 
      error: 'Errore verifica struttura tabella',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
});

// Endpoint per verificare la connessione al database
router.get('/debug/db-connection', async (req, res) => {
  try {
    console.log('[API Debug] Verifica connessione al database...');
    
    // Verifica la connessione al database con una query semplice
    const testQuery = await db.execute('SELECT version()');
    
    res.json({
      message: 'Connessione al database OK',
      version: testQuery.rows[0].version,
      dbModule: typeof db
    });
  } catch (error) {
    console.error('[API Debug] Errore connessione al database:', error);
    res.status(500).json({ 
      error: 'Errore di connessione al database',
      details: error instanceof Error ? error.message : JSON.stringify(error)
    });
  }
});

// Esporta il router
export default router;