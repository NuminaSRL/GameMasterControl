import { useState } from "react";
import { Game } from '../../shared/schema';

interface GameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onToggle: (gameId: number) => void;
}

// Aggiungi una funzione per convertire il livello di difficoltà in testo
const getDifficultyText = (difficulty: number) => {
  switch(difficulty) {
    case 1: return "Facile";
    case 2: return "Medio";
    case 3: return "Difficile";
    default: return "Facile";
  }
};

// Aggiungi una funzione per ottenere il colore della difficoltà
const getDifficultyColor = (difficulty: number) => {
  switch(difficulty) {
    case 1: return "bg-green-100 text-green-800";
    case 2: return "bg-yellow-100 text-yellow-800";
    case 3: return "bg-red-100 text-red-800";
    default: return "bg-green-100 text-green-800";
  }
};

export default function GameTable({ games, onEdit, onToggle }: GameTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Pagination logic
  const totalPages = Math.ceil(games.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGames = games.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="overflow-x-auto rounded-lg shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Nome Gioco
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Stato
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Difficoltà
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Timer
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Domande
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Classifiche
            </th>
            <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedGames.map((game) => (
            <tr key={game.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{game.name}</div>
                <div className="text-sm text-gray-500 truncate max-w-xs">{game.description}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  game.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {game.isActive ? 'Attivo' : 'Inattivo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDifficultyColor(game.difficulty)}`}>
                  {getDifficultyText(game.difficulty)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {game.timerDuration} sec
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {game.questionCount}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {game.weeklyLeaderboard ? 'Settimanale' : ''} 
                {game.weeklyLeaderboard && game.monthlyLeaderboard ? ' / ' : ''}
                {game.monthlyLeaderboard ? 'Mensile' : ''}
                {!game.weeklyLeaderboard && !game.monthlyLeaderboard ? 'Nessuna' : ''}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                <button
                  onClick={() => onEdit(game)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => onToggle(game.id)}
                  className={`${
                    game.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                  }`}
                >
                  <i className={`fas ${game.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                </button>
              </td>
            </tr>
          ))}
          {paginatedGames.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                <i className="fas fa-gamepad text-gray-300 text-4xl mb-3"></i>
                <p>Nessun gioco trovato</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Pagination controls remain the same */}
      {totalPages > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 font-medium">
              Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, games.length)} di {games.length} giochi
            </div>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1.5 flex items-center border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <i className="fas fa-chevron-left mr-1"></i> Precedente
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show pages around current page if there are many pages
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }
                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="px-3 py-1.5 flex items-center border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Successivo <i className="fas fa-chevron-right ml-1"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
