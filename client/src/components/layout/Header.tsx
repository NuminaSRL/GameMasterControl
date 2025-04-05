import { useState } from "react";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center py-4 px-6 border-b border-gray-200">
        <div className="flex md:hidden">
          <button
            type="button"
            className="text-gray-500 hover:text-gray-600 focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className="fas fa-bars"></i>
          </button>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Gestione Giochi</h1>
        <div className="flex items-center">
          <div className="ml-3 relative">
            <div>
              <button type="button" className="flex text-sm rounded-full focus:outline-none">
                <i className="fas fa-user-circle text-2xl text-gray-500"></i>
              </button>
            </div>
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
