import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Game } from "@shared/schema";
import GameRow from "./GameRow";
import EditGameModal from "./EditGameModal";

export default function GameTable() {
  const [currentPage, setCurrentPage] = useState(1);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const itemsPerPage = 5;

  // Fetch games data
  const { data: games = [], isLoading, error } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  // Toggle game status mutation
  const toggleGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const res = await apiRequest('POST', `/api/games/${gameId}/toggle`, undefined);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Stato gioco aggiornato",
        description: "Lo stato del gioco è stato modificato con successo",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Impossibile aggiornare lo stato del gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    },
  });

  // Handle game toggling
  const handleToggleGame = (gameId: number) => {
    toggleGameMutation.mutate(gameId);
  };

  // Handle game editing
  const handleEditGame = (game: Game) => {
    setEditingGame(game);
    setIsModalOpen(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(games.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGames = games.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-2xl text-gray-500 mb-2"></i>
          <p className="text-gray-500">Caricamento giochi...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-500">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>Si è verificato un errore nel caricamento dei giochi.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Lista Giochi</h2>
          <Button 
            className="px-4 py-2 bg-primary text-white rounded-md flex items-center hover:bg-blue-600"
            onClick={() => {
              setEditingGame(null);
              setIsModalOpen(true);
            }}
          >
            <i className="fas fa-plus mr-2"></i>
            Nuovo Gioco
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome Gioco
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timer
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Domande
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classifiche
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedGames.map((game) => (
                <GameRow 
                  key={game.id} 
                  game={game} 
                  onEdit={() => handleEditGame(game)}
                  onToggle={() => handleToggleGame(game.id)}
                />
              ))}
              {paginatedGames.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Nessun gioco trovato
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Mostrando {paginatedGames.length} di {games.length} giochi
            </div>
            {totalPages > 1 && (
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Precedente
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`px-3 py-1 border border-gray-300 rounded-md text-sm ${
                      currentPage === page
                        ? "bg-primary text-white hover:bg-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Successivo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <EditGameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        game={editingGame}
      />
    </>
  );
}
