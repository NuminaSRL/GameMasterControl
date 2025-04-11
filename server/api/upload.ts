import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Configura multer per l'upload dei file
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(process.cwd(), 'public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite di 5MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Accetta solo immagini
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo i file immagine sono supportati'));
    }
  }
}).single('image');

// Funzione per gestire l'upload delle immagini
export function configureUploadRoute(app: any) {
  app.post('/api/upload', function(req: any, res: any) {
    uploadMiddleware(req, res, function(err: any) {
      if (err) {
        return res.status(400).json({ 
          error: 'Errore durante l\'upload', 
          details: err.message 
        });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: 'Nessun file caricato' });
      }
      
      // Costruisci l'URL dell'immagine
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Restituisci l'URL dell'immagine
      return res.status(200).json({ imageUrl });
    });
  });
  
  // Aggiungi una route per servire i file statici
  app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
  
  console.log('[Server] Route di upload configurata');
}