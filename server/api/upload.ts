import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

// Configura il client Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Configura multer per l'upload temporaneo dei file
const storage = multer.memoryStorage(); // Cambiato a memory storage
const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limite file
  },
  fileFilter: (req, file, cb) => {
    // Permetti solo immagini
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo file immagine sono supportati!') as any, false);
    }
  }
});

const BUCKET_NAME = 'uploads';

// Funzione per inizializzare il bucket se non esiste
async function initSupabaseBucket() {
  try {
    // Verifica se il bucket esiste
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      // Crea bucket se non esiste
      const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true, // Rende pubblici i file
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limite file
      });
      
      if (error) {
        // Ignora l'errore specifico "The resource already exists"
        if (error.message && error.message.includes('already exists')) {
          console.log('[Supabase] Bucket già esistente (rilevato durante la creazione)');
        } else {
          console.error('[Supabase] Errore creazione bucket:', error);
        }
      } else {
        console.log('[Supabase] Bucket creato con successo:', data);
      }
    } else {
      console.log('[Supabase] Bucket già esistente');
    }
  } catch (error) {
    console.error('[Supabase] Errore inizializzazione bucket:', error);
  }
}

// Funzione per gestire l'upload delle immagini
export function configureUploadRoute(app: any) {
  // Inizializza il bucket Supabase
  initSupabaseBucket();
  
  // Route per upload di immagini
  app.post('/api/upload', upload.single('image'), async (req: express.Request, res: express.Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }
      
      // Genera un nome file unico
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${uuidv4()}${fileExt}`;
      
      // Carica il file su Supabase
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('[Supabase] Errore caricamento file:', error);
        return res.status(500).json({ error: 'Errore caricamento file su Supabase' });
      }
      
      // Ottieni URL pubblico
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);
      
      const imageUrl = urlData.publicUrl;
      console.log('[Supabase] File caricato con successo, URL:', imageUrl);
      
      res.json({ imageUrl });
    } catch (error) {
      console.error('[Supabase] Errore:', error);
      res.status(500).json({ error: 'Errore durante l\'upload dell\'immagine' });
    }
  });
  
  // Route per verificare se un'immagine esiste
  app.get('/api/check-image', async (req: express.Request, res: express.Response) => {
    try {
      const imageUrl = req.query.url as string;
      if (!imageUrl) {
        return res.status(400).json({ error: 'URL immagine non specificato' });
      }
      
      // Estrai il nome del file dall'URL in modo più robusto
      let fileName = '';
      try {
        // Per URL completi (https://...)
        if (imageUrl.startsWith('http')) {
          const url = new URL(imageUrl);
          fileName = url.pathname.split('/').pop() || '';
        } else {
          // Per path relativi (/uploads/...)
          fileName = imageUrl.split('/').pop() || '';
        }
        
        // Rimuovi parametri di query se presenti
        fileName = fileName.split('?')[0];
      } catch (parseError) {
        console.error('[Supabase] Errore parsing URL:', parseError);
        return res.status(400).json({ error: 'URL formato non valido' });
      }
      
      if (!fileName) {
        return res.status(400).json({ error: 'Nome file non valido' });
      }
      
      console.log('[Supabase] Verifica file:', fileName);
      
      // Verifica se il file esiste su Supabase
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: fileName
        });
      
      if (error) {
        console.error('[Supabase] Errore list storage:', error);
        return res.status(500).json({ error: 'Errore verifica file' });
      }
      
      const fileExists = data.some(file => file.name === fileName);
      
      res.json({
        exists: fileExists,
        fileName: fileName,
        url: imageUrl,
        storage: 'supabase'
      });
    } catch (error) {
      console.error('[Supabase] Errore check-image:', error);
      res.status(500).json({ error: 'Errore durante la verifica dell\'immagine' });
    }
  });
  
  console.log('[Server] Route di upload Supabase configurata');
}