import * as React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [redirected, setRedirected] = React.useState(false);

  // Aggiungiamo log per debug
  React.useEffect(() => {
    console.log('ProtectedRoute - Current location:', location);
    console.log('ProtectedRoute - Authentication status:', isAuthenticated ? 'authenticated' : 'not authenticated');
    console.log('ProtectedRoute - Loading status:', isLoading ? 'loading' : 'not loading');
  }, [location, isAuthenticated, isLoading]);

  React.useEffect(() => {
    // Preveniamo reindirizzamenti multipli
    if (!isLoading && !isAuthenticated && !redirected) {
      console.log('Utente non autenticato, reindirizzamento alla pagina di login');
      setRedirected(true);
      
      // Aggiungiamo un parametro per prevenire cicli infiniti
      const urlParams = new URLSearchParams(window.location.search);
      const noRedirect = urlParams.get('noRedirect');
      
      if (noRedirect === 'true') {
        console.log('Reindirizzamento disabilitato per debug');
        return;
      }
      
      // Verifichiamo se siamo già nella pagina di login per evitare cicli
      if (location !== '/login') {
        console.log('Reindirizzamento a /login');
        setLocation('/login');
      } else {
        console.log('Già nella pagina di login, nessun reindirizzamento necessario');
      }
    }
  }, [isAuthenticated, isLoading, setLocation, redirected, location]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Se l'utente è autenticato, mostra il contenuto protetto
  return isAuthenticated ? <>{children}</> : <LoadingScreen />;
};

export default ProtectedRoute;