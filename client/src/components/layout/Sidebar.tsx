import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarItemProps {
  href: string;
  icon: string;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ href, icon, children, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center px-4 py-2 mt-1 text-sm font-medium rounded-md group cursor-pointer",
          active
            ? "text-white bg-gray-700"
            : "text-gray-300 hover:bg-gray-700 hover:text-white"
        )}
      >
        <i className={`${icon} mr-3 ${active ? "text-gray-300" : "text-gray-400"}`}></i>
        {children}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const [clientLogo, setClientLogo] = useState<string | null>(null);
  
  // Carica il logo del cliente quando l'utente è autenticato
  useEffect(() => {
    console.log("User in Sidebar:", user);
    
    if (user && user.clientId) {
      // Costruisci il percorso del logo basato sul client_id
      const logoPath = `/api/clients/${user.clientId}/logo`;
      console.log("Setting client logo path:", logoPath);
      setClientLogo(logoPath);
      
      // Verifica se l'endpoint è raggiungibile
      fetch(logoPath, { method: 'HEAD' })
        .then(response => {
          console.log("Logo endpoint response:", response.status);
        })
        .catch(error => {
          console.error("Error checking logo endpoint:", error);
        });
    } else {
      console.log("No clientId found in user object");
      setClientLogo(null);
    }
  }, [user]);
  
  // Log quando il logo cambia
  useEffect(() => {
    console.log("Client logo state:", clientLogo);
  }, [clientLogo]);
  
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-800 border-r border-gray-700">
        <div className="px-6 pt-8 pb-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center">
              <i className="fas fa-gamepad text-white text-xl mr-3"></i>
              <h1 className="text-xl font-semibold text-white">Game Manager</h1>
            </div>
            
            {/* Logo del cliente */}
            {clientLogo && (
              <div className="mt-3 w-full flex justify-center">
                <img 
                  src={clientLogo} 
                  alt="Logo Cliente" 
                  className="h-10 w-auto object-contain bg-white p-1 rounded"
                  onError={(e) => {
                    console.error("Error loading logo:", e);
                    setClientLogo(null);
                  }}
                />
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col flex-grow px-4 mt-5">
          <nav className="flex-1 space-y-1">
            <SidebarItem href="/" icon="fas fa-tachometer-alt" active={location === "/"}>
              Dashboard
            </SidebarItem>
            <SidebarItem href="/games" icon="fas fa-trophy" active={location === "/games"}>
              Giochi
            </SidebarItem>
            <SidebarItem href="/badges" icon="fas fa-medal" active={location === "/badges"}>
              Badge
            </SidebarItem>
            <SidebarItem href="/rewards" icon="fas fa-gift" active={location === "/rewards"}>
              Premi
            </SidebarItem>
            <SidebarItem href="/settings" icon="fas fa-cog" active={location === "/settings"}>
              Impostazioni
            </SidebarItem>
            <SidebarItem href="/api-test" icon="fas fa-flask" active={location === "/api-test"}>
              Test API
            </SidebarItem>
            <SidebarItem href="/feltrinelli-mapping" icon="fas fa-exchange-alt" active={location === "/feltrinelli-mapping"}>
              Mapping Feltrinelli
            </SidebarItem>
          </nav>
        </div>
        <div className="flex-shrink-0 flex p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white">Admin</p>
              <p className="text-xs font-medium text-gray-400">Visualizza profilo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}