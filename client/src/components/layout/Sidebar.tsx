import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle?: () => void; // Resa opzionale
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  
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

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <div className={`bg-gray-800 text-white transition-all duration-300 h-screen ${collapsed ? 'w-16' : 'w-64'} fixed`}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && <h2 className="text-xl font-bold">Game Manager</h2>}
        {/* Rimuoviamo il pulsante di toggle dalla sidebar */}
      </div>
      
      <nav className="mt-5">
        <ul>
          <li className={`px-4 py-2 ${isActive('/') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            <Link href="/" className="flex items-center">
              <i className="fas fa-tachometer-alt"></i>
              {!collapsed && <span className="ml-2">Dashboard</span>}
            </Link>
          </li>
          <li className={`px-4 py-2 ${isActive('/games') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            <Link href="/games" className="flex items-center">
              <i className="fas fa-gamepad"></i>
              {!collapsed && <span className="ml-2">Giochi</span>}
            </Link>
          </li>
          <li className={`px-4 py-2 ${isActive('/badges') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            <Link href="/badges" className="flex items-center">
              <i className="fas fa-medal"></i>
              {!collapsed && <span className="ml-2">Badge</span>}
            </Link>
          </li>
          <li className={`px-4 py-2 ${isActive('/rewards') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            <Link href="/rewards" className="flex items-center">
              <i className="fas fa-gift"></i>
              {!collapsed && <span className="ml-2">Premi</span>}
            </Link>
          </li>
          <li className={`px-4 py-2 ${isActive('/api-test') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            <Link href="/api-test" className="flex items-center">
              <i className="fas fa-code"></i>
              {!collapsed && <span className="ml-2">Test API</span>}
            </Link>
          </li>
          <li className={`px-4 py-2 ${isActive('/feltrinelli-mapping') ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
            <Link href="/feltrinelli-mapping" className="flex items-center">
              <i className="fas fa-map-signs"></i>
              {!collapsed && <span className="ml-2">Mapping Feltrinelli</span>}
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}