import { Router } from 'express';
import { DatabaseStorage } from '../../storage';
import { db } from '../../db';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import { AuthService } from '../../services/authService';

const router = Router();
const storage = new DatabaseStorage();
const authService = new AuthService(storage);

// Ottieni tutti i client (accessibile pubblicamente per la registrazione)
router.get('/public', async (req, res) => {
  try {
    const clients = await storage.getAllClients();
    // Restituisci solo id e nome per motivi di sicurezza
    const safeClients = clients.map(client => ({
      id: client.id,
      name: client.name
    }));
    res.json(safeClients);
  } catch (error) {
    res.status(500).json({ message: `Error fetching clients: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Ottieni tutti i client (solo admin)
router.get('/', authMiddleware(authService), roleMiddleware(['admin']), async (req, res) => {
  try {
    const clients = await storage.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: `Error fetching clients: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Ottieni un client specifico per ID
router.get('/:id', authMiddleware(authService), async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: `Error fetching client: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Crea un nuovo client (solo admin)
router.post('/', authMiddleware(authService), roleMiddleware(['admin']), async (req, res) => {
  try {
    const { name, logo_url } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }
    
    // Crea il nuovo client
    const result = await db.execute(`
      INSERT INTO clients (name, logo_url, api_key, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      RETURNING id, name, logo_url, created_at, updated_at
    `, [name, logo_url || null, `${name.toLowerCase().replace(/\s+/g, '_')}_api_key_${Date.now()}`]);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: `Error creating client: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Aggiorna un client esistente (solo admin)
router.patch('/:id', authMiddleware(authService), roleMiddleware(['admin']), async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { name, logo_url } = req.body;
    
    // Verifica che il client esista
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Costruisci la query di aggiornamento
    let updateQuery = 'UPDATE clients SET updated_at = NOW()';
    const params = [];
    let paramIndex = 1;
    
    if (name) {
      updateQuery += `, name = $${paramIndex}`;
      params.push(name);
      paramIndex++;
    }
    
    if (logo_url !== undefined) {
      updateQuery += `, logo_url = $${paramIndex}`;
      params.push(logo_url);
      paramIndex++;
    }
    
    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, name, logo_url, created_at, updated_at`;
    params.push(clientId);
    
    const result = await db.execute(updateQuery, params);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: `Error updating client: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

// Elimina un client (solo admin)
router.delete('/:id', authMiddleware(authService), roleMiddleware(['admin']), async (req, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    // Verifica che il client esista
    const client = await storage.getClient(clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // Elimina il client
    await db.execute('DELETE FROM clients WHERE id = $1', [clientId]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: `Error deleting client: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

export default router;