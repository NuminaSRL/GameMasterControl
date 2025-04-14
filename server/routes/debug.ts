import express from 'express';
import { supabase } from '../supabase';
import { storage } from '../storage';

const router = express.Router();

// Endpoint per testare la connessione a Supabase e la tabella clients
router.get('/supabase-clients', async (req, res) => {
  try {
    console.log('[Debug] Testing Supabase clients connection');
    
    // Test diretto della query a Supabase
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    // Test tramite storage
    const storageClients = await storage.getAllClients();
    
    if (error) {
      console.error('[Debug] Supabase query error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    console.log('[Debug] Supabase direct clients:', data);
    console.log('[Debug] Storage clients:', storageClients);
    
    res.json({
      success: true,
      directQuery: {
        count: data?.length || 0,
        clients: data || []
      },
      storageQuery: {
        count: storageClients?.length || 0,
        clients: storageClients || []
      },
      environment: process.env.NODE_ENV,
      supabaseUrl: process.env.SUPABASE_URL ? 'Present' : 'Missing',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Present' : 'Missing'
    });
  } catch (error) {
    console.error('[Debug] Supabase test error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    });
  }
});

// Endpoint per verificare la struttura della tabella clients
router.get('/check-clients-table', async (req, res) => {
  try {
    console.log('[Debug] Checking clients table structure');
    
    // Verifica se la tabella clients esiste
    const { count, error } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('[Debug] Error checking clients table:', error);
      return res.status(500).json({ error: error.message });
    }
    
    // Ottieni informazioni sulla struttura della tabella
    const { data: tableInfo, error: tableError } = await supabase.rpc('get_table_info', {
      table_name: 'clients'
    });
    
    if (tableError) {
      console.warn('[Debug] Could not get table info:', tableError);
    }
    
    res.json({
      success: true,
      tableExists: count !== null,
      recordCount: count,
      tableStructure: tableInfo || 'Not available'
    });
  } catch (error) {
    console.error('[Debug] Table check error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;