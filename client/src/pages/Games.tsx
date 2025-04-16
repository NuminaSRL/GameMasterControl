import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import GameTable from "@/components/games/GameTable";
import EditGameModal from "@/components/games/EditGameModal";
import { Stats, Game } from '../shared/schema';
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GameRewardsModal from "@/components/games/GameRewardsModal";

export default function Games() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  // Fetch games
  const { data: games = [], isLoading, error } = useQuery<Game[]>({
    queryKey: ['/api/feltrinelli/games'],
    queryFn: async () => {
      try {
        console.log('Fetching games from Feltrinelli API');
        const response = await fetch('/api/feltrinelli/games');
        
        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          throw new Error(`Network response was not ok: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Raw data from Feltrinelli API:', data);
        
        // Assicuriamoci che i campi siano mappati correttamente
        const formattedGames = data.map((game: any) => ({
          id: game.id,
          name: game.name,
          description: game.description || '',
          isActive: game.is_active || game.isActive || false,
          imageUrl: game.image_url || game.imageUrl || '',
          settings: game.settings || {},
          createdAt: game.created_at || game.createdAt || new Date().toISOString(),
          updatedAt: game.updated_at || game.updatedAt || new Date().toISOString()
        }));
        
        console.log('Formatted games:', formattedGames);
        return formattedGames;
      } catch (err) {
        console.error('Error fetching games:', err);
        throw err;
      }
    }
  });

  // Toggle game status mutation
  const toggleGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      // Ottieni lo stato attuale del gioco
      const game = games.find(g => g.id === gameId);
      if (!game) {
        console.error('Gioco non trovato:', gameId);
        throw new Error('Gioco non trovato');
      }
      
      console.log('Toggling game status for game:', game);
      console.log('Current status:', game.isActive);
      
      // Usa l'endpoint Feltrinelli per aggiornare le impostazioni
      const res = await apiRequest('PATCH', `/api/feltrinelli/games/${gameId}/settings`, {
        is_active: !game.isActive
      });
      
      console.log('Toggle response:', res);
      return res;
    },
    onSuccess: () => {
      // Aggiorna sia le query vecchie che quelle nuove per garantire la compatibilità
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Stato Gioco Aggiornato",
        description: "Lo stato del gioco è stato aggiornato con successo.",
      });
    },
    onError: (error) => {
      console.error('Error toggling game status:', error);
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

  // Funzione per aprire la modale di associazione premi
  const handleManageRewards = (game: Game) => {
    setCurrentGame(game);
    setIsRewardsModalOpen(true);
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
              onManageRewards={handleManageRewards}
            />
          )}
        </CardContent>
      </Card>

      <EditGameModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        game={currentGame} 
      />
      
      
      <GameRewardsModal
        isOpen={isRewardsModalOpen}
        onClose={() => {
          setIsRewardsModalOpen(false);
          setCurrentGame(null);
        }}
        game={currentGame}
      />
    </div>
  );
}