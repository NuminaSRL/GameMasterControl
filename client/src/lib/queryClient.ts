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
  // Correggi l'inversione dei parametri
  let path: string;
  let method: string;
  
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
  console.log(`Original path: ${path}`);
  
  // Utilizziamo un approccio più sicuro per determinare l'ambiente
  const isProd = typeof window !== 'undefined' && 
                window.location.hostname !== 'localhost' && 
                !window.location.hostname.includes('127.0.0.1');
  console.log(`Environment: ${isProd ? 'Production' : 'Development'}`);
  console.log(`API Base URL: ${getApiBaseUrl()}`);
  
  try {
    // Assicuriamoci che il metodo sia una stringa valida
    if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'].includes(method)) {
      throw new Error(`Invalid HTTP method: ${method}`);
    }
    
    const res = await fetch(apiUrl, {
      method: method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return await res.json();
  } catch (error) {
    console.error(`Error making request to ${method} ${apiUrl}:`, error);
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
