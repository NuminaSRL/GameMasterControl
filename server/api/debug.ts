import express from 'express';
import path from 'path';
import fs from 'fs';

export function configureDebugRoutes(app: any) {
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
  
  console.log('[Server] Route di debug configurata');
}