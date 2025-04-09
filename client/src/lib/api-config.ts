// Configurazione API per collegare frontend e backend
// Utilizzato per gestire gli endpoint API in base all'ambiente

// Ottieni l'URL base per le chiamate API in base all'ambiente
export function getApiBaseUrl(): string {
  // In produzione, usa sempre /api come base URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return '/api';
  }
  
  // Durante lo sviluppo, usa un valore predefinito
  return 'http://localhost:5000/api';
}

// Utilizza questa funzione per costruire URL API completi
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  // Assicurati che l'endpoint non inizi con una barra se il baseUrl termina con una
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${formattedEndpoint}`;
}