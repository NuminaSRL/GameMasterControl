import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl, getApiBaseUrl } from "./api-config";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  pathOrMethod: string,
  methodOrPath: string = "GET",
  data?: unknown | undefined,
): Promise<T> {
  try {
    // Correggi l'inversione dei parametri
    let path: string;
    let method: string;
    
    console.log('apiRequest called with:', { pathOrMethod, methodOrPath, data });
    
    // Verifica se i parametri sono invertiti
    if (methodOrPath.startsWith('/api') && ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(pathOrMethod.toUpperCase())) {
      // I parametri sono invertiti
      method = pathOrMethod.toUpperCase();
      path = methodOrPath;
      console.log('Detected inverted parameters, correcting...');
    } else {
      // Parametri nell'ordine corretto
      path = pathOrMethod;
      method = methodOrPath.toUpperCase();
    }
    
    // Costruisci l'URL API completo usando buildApiUrl
    const apiUrl = path.startsWith('/api') ? buildApiUrl(path.substring(4)) : path;
    
    console.log(`Making API request to: ${apiUrl} with method: ${method}`);
    console.log(`Request data:`, data);
    
    // Assicuriamoci che il metodo sia una stringa valida
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(method)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }
    
    // Log dettagliato della richiesta
    console.log(`Sending ${method} request to ${apiUrl} with:`, {
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined
    });
    
    const res = await fetch(apiUrl, {
      method: method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`Response status: ${res.status} ${res.statusText}`);
    
    // Log della risposta prima di verificare se è ok
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error response: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`${res.status}: ${errorText || res.statusText}`);
    }
    
    // Verifica se la risposta è vuota prima di chiamare .json()
    const contentType = res.headers.get('content-type');
    console.log(`Response content-type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await res.json();
      console.log(`Response JSON data:`, jsonData);
      return jsonData;
    } else {
      // Se non è JSON, restituisci un oggetto vuoto o il testo
      const text = await res.text();
      console.log(`Response text:`, text);
      return (text ? { message: text } : {}) as T;
    }
  } catch (error) {
    console.error(`Error in apiRequest:`, error);
    throw error;
  }
}

// Aggiungi questa funzione specifica per aggiornare le impostazioni dei giochi Feltrinelli
export async function updateFeltrinelliGameSettings(gameId: string, settings: any): Promise<any> {
  console.log(`Updating Feltrinelli game settings for game ${gameId}:`, settings);
  
  try {
    // Verifica che l'ID del gioco sia valido
    if (!gameId) {
      console.error('Invalid game ID:', gameId);
      throw new Error('Invalid game ID');
    }
    
    // Costruisci l'URL completo per debug
    const fullUrl = `/api/feltrinelli/games/${gameId}/settings`;
    console.log(`Full URL for update: ${fullUrl}`);
    
    // Usa direttamente apiRequest per garantire coerenza
    return await apiRequest(
      fullUrl,
      'PUT',
      settings
    );
  } catch (error) {
    console.error(`Error updating Feltrinelli game settings for game ${gameId}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Applica buildApiUrl anche per le richieste di query
    const path = queryKey[0] as string;
    const apiUrl = path.startsWith('/api') ? buildApiUrl(path.substring(4)) : path;
    
    try {
      const res = await fetch(apiUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error(`Error in query function for ${apiUrl}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Verifica che apiRequest stia gestendo correttamente gli endpoint
// export const apiRequest = async (method: string, endpoint: string, data?: any) => {
//   console.log(`Making ${method} request to ${endpoint}`, data);
//   
//   const options: RequestInit = {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//     },
//   };
//
//   if (data) {
//     options.body = JSON.stringify(data);
//   }
//
//   const response = await fetch(endpoint, options);
//   
//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`API error (${response.status}):`, errorText);
//     throw new Error(`API error: ${response.status} ${errorText}`);
//   }
//   
//   // Per richieste che non restituiscono JSON (come DELETE)
//   if (response.headers.get('content-length') === '0') {
//     return null;
//   }
//   
//   try {
//     return await response.json();
//   } catch (error) {
//     console.warn('Response is not JSON:', error);
//     return null;
//   }
// };
