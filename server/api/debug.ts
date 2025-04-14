import express, { Express } from 'express'; // Update this line to import Express type
import path from 'path';
import fs from 'fs';
import { storage } from '../storage'; // Add this import for storage
import { SupabaseStorage } from '../supabase-storage'; // Add this import for SupabaseStorage

// Aggiungi questo nuovo endpoint nella funzione configureDebugRoutes

export function configureDebugRoutes(app: Express) {
  app.get('/api/debug-upload-path', function(req: any, res: any) {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    const uploadDirAbsolute = path.resolve(uploadDir);
    
    // Check if directories exist
    const publicExists = fs.existsSync(path.join(process.cwd(), 'public'));
    const uploadsExists = fs.existsSync(uploadDir);
    
    // Check permissions
    let canWrite = false;
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      canWrite = true;
    } catch (err) {
      canWrite = false;
    }
    
    // Create test file 
    let testFileCreated = false;
    const testFilePath = path.join(uploadDir, 'test.txt');
    try {
      if (uploadsExists) {
        fs.writeFileSync(testFilePath, 'Test file');
        testFileCreated = true;
        // Clean up
        fs.unlinkSync(testFilePath);
      }
    } catch (err) {
      console.error('Errore nella creazione del file di test:', err);
    }
    
    return res.status(200).json({
      cwd: process.cwd(),
      uploadDir,
      uploadDirAbsolute,
      publicExists,
      uploadsExists,
      canWrite,
      testFileCreated,
      env: process.env.NODE_ENV
    });
  });
  
  // Endpoint per verificare il tipo di storage in uso
  app.get('/api/debug/storage-info', (req, res) => {
    try {
      const storageInfo = {
        type: storage.constructor.name,
        isSupabase: storage instanceof SupabaseStorage,
        environment: process.env.NODE_ENV || 'development',
        supabaseUrl: process.env.SUPABASE_URL ? 'Present' : 'Missing'
      };
      res.json(storageInfo);
    } catch (error) {
      res.status(500).json({ error: 'Error getting storage info', message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });
}
console.log('[Server] Route di debug configurata');