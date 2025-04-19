import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export default function Header({ onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  
  // Carica il logo del cliente quando l'utente è autenticato
  useEffect(() => {
    if (user && user.clientId) {
      // Costruisci il percorso del logo basato sul client_id
      const logoPath = `/api/clients/${user.clientId}/logo`;
      setClientLogo(logoPath);
    } else {
      setClientLogo(null);
    }
  }, [user]);

  // Chiudi il menu utente quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200">
        <div className="flex items-center">
          {onToggleSidebar && (
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none mr-4 transition-colors"
              onClick={onToggleSidebar}
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-800">Gestione Giochi</h1>
          {clientLogo && (
            <div className="ml-4">
              <img 
                src={clientLogo} 
                alt="Logo Cliente" 
                className="h-8 w-auto object-contain"
                onError={() => setClientLogo(null)} // Gestisce errori di caricamento
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="ml-3 relative" ref={userMenuRef}>
            <div>
              <button 
                type="button" 
                className="flex text-sm rounded-full focus:outline-none"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <i className="fas fa-user-circle text-2xl text-gray-500"></i>
              </button>
            </div>
            
            {/* Menu a tendina utente */}
            {isUserMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-10">
                {user && (
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <p className="font-medium">{user.username || user.email}</p>
                    <p className="text-xs text-gray-500">{user.role}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-800 py-2">
          <nav className="px-4 space-y-1">
            <a href="/" className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md">
              <i className="fas fa-tachometer-alt mr-3 text-gray-300"></i>
              Dashboard
            </a>
            <a href="/games" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
              <i className="fas fa-trophy mr-3 text-gray-400"></i>
              Giochi
            </a>
            <a href="/badges" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
              <i className="fas fa-medal mr-3 text-gray-400"></i>
              Badge
            </a>
            <a href="/rewards" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
              <i className="fas fa-gift mr-3 text-gray-400"></i>
              Premi
            </a>
            <a href="/settings" className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
              <i className="fas fa-cog mr-3 text-gray-400"></i>
              Impostazioni
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}