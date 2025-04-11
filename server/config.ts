// Se il file non esiste, crealo
export const config = {
  // Altri parametri di configurazione...
  
  // Feature flag per la nuova implementazione Feltrinelli
  ENABLE_NEW_FELTRINELLI_IMPLEMENTATION: process.env.ENABLE_NEW_FELTRINELLI_IMPLEMENTATION === 'true',
};