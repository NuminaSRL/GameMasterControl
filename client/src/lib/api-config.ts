// Configurazione API per collegare frontend e backend
// Utilizzato per gestire gli endpoint API in base all'ambiente

// Ottieni l'URL base per le chiamate API in base all'ambiente
export function getApiBaseUrl(): string {
  try {
    // Verifica se siamo in produzione in modo più sicuro
    const isProd = typeof window !== 'undefined' && 
                  window.location.hostname !== 'localhost' && 
                  !window.location.hostname.includes('127.0.0.1');
    
    // In produzione, usa l'URL di Railway configurato in vercel.json
    if (isProd) {
      console.log('Running in production mode');
      return '/api';
    }
    
    // Durante lo sviluppo usa l'URL locale o variabile d'ambiente
    // Accedi alla variabile d'ambiente in modo più sicuro
    let apiUrl;
    
    // Utilizziamo un approccio più diretto per accedere alle variabili d'ambiente
    // che non dipende da import.meta
    const processEnv = process?.env || {};
    apiUrl = processEnv.VITE_API_URL;
    
    console.log('API URL from env:', apiUrl);
    
    if (apiUrl) {
      return apiUrl;
    }
    
    // URL di fallback per lo sviluppo locale
    return 'http://localhost:5000/api';
  } catch (error) {
    console.error('Error in getApiBaseUrl:', error);
    return '/api'; // Fallback sicuro
  }
}

export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  console.log('Base URL for API calls:', baseUrl);
  
  // Assicurati che l'endpoint non inizi con una barra se il baseUrl termina con una
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
}