import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GameTable from "@/components/games/GameTable";
import EditGameModal from "@/components/games/EditGameModal";
import { Game } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Games() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  // Fetch games
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
        title: "Stato Gioco Aggiornato",
        description: "Lo stato del gioco è stato aggiornato con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile aggiornare lo stato del gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    },
  });

  // Handle edit game
  const handleEditGame = (game: Game) => {
    setCurrentGame(game);
    setIsModalOpen(true);
  };

  // Handle create new game
  const handleCreateGame = () => {
    setCurrentGame(null);
    setIsModalOpen(true);
  };

  // Handle toggle game status
  const handleToggleGameStatus = (gameId: number) => {
    toggleGameMutation.mutate(gameId);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentGame(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestione Giochi</h2>
        <Button onClick={handleCreateGame}>
          <i className="fas fa-plus mr-2"></i>
          Nuovo Gioco
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Giochi ({games.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 p-4">
              Errore nel caricamento dei giochi
            </div>
          ) : games.length === 0 ? (
            <div className="text-center text-gray-500 p-4">
              Nessun gioco configurato. Crea il tuo primo gioco!
            </div>
          ) : (
            <GameTable 
              games={games} 
              onEdit={handleEditGame} 
              onToggle={handleToggleGameStatus}
            />
          )}
        </CardContent>
      </Card>

      <EditGameModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        game={currentGame} 
      />
    </div>
  );
}