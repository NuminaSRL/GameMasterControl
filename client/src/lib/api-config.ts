// Configurazione API per collegare frontend e backend
// Utilizzato per gestire gli endpoint API in base all'ambiente

// Ottieni l'URL base per le chiamate API in base all'ambiente
export function getApiBaseUrl(): string {
  // In produzione, usa l'URL di Railway configurato in vercel.json
  if (import.meta.env.PROD) {
    // In produzione, le API calls verranno proxate tramite vercel.json
    return '/api';
  }
  
  // Durante lo sviluppo usa l'URL locale o variabile d'ambiente
  return import.meta.env.VITE_API_URL || '/api';
}

// Utilizza questa funzione per costruire URL API completi
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Assicurati che l'endpoint non inizi con una barra se il baseUrl termina con una
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
}