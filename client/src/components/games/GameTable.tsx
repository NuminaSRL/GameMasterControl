import { useState } from "react";
import { Game } from '../../shared/schema';
import GameRow from "./GameRow";

interface GameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onToggle: (gameId: number) => void;
}

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
              Timer
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Domande
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Classifiche
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {paginatedGames.map((game) => (
            <GameRow 
              key={game.id} 
              game={game} // Rimuovi il type assertion "as any"
              onEdit={() => onEdit(game)}
              onToggle={() => onToggle(game.id)}
            />
          ))}
          {paginatedGames.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                <i className="fas fa-gamepad text-gray-300 text-4xl mb-3"></i>
                <p>Nessun gioco trovato</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
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
