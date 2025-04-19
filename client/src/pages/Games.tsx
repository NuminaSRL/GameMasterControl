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
        // Usa apiRequest per coerenza e gestione errori centralizzata
        const data = await apiRequest('GET', '/api/feltrinelli/games');
        console.log('Raw data from Feltrinelli API:', data);

        // Se il backend formatta già i dati, il mapping qui potrebbe non essere necessario
        // o può essere molto più semplice. Assumiamo che il backend restituisca
        // già i campi con i nomi attesi dal tipo 'Game'.
        if (!Array.isArray(data)) {
           console.error("Received non-array data from /api/feltrinelli/games", data);
           throw new Error("Invalid data format received from server");
        }

        // Verifica che i campi necessari esistano, aggiungi log se mancano
        data.forEach((game: any, index: number) => {
          if (game.timerDuration === undefined || game.weeklyLeaderboard === undefined || game.monthlyLeaderboard === undefined) {
            console.warn(`Game at index ${index} (ID: ${game.id}) might be missing expected fields:`, game);
          }
        });

        return data as Game[]; // Fai il cast al tipo Game

      } catch (err) {
        console.error('Error fetching games:', err);
        toast({
          title: "Errore nel Caricamento",
          description: `Impossibile caricare i giochi: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`,
          variant: "destructive",
        });
        return []; // Restituisci array vuoto in caso di errore
      }
    },
    // Aggiungi opzioni per refetch o stale time se necessario
    // refetchOnWindowFocus: false,
    // staleTime: 5 * 60 * 1000, // 5 minuti
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
      // Assicurati di inviare tutti i campi necessari, non solo is_active
      const res = await apiRequest('PUT', `/api/feltrinelli/games/${gameId}/settings`, {
        name: game.name,
        description: game.description,
        isActive: !game.isActive,
        weeklyLeaderboard: game.weeklyLeaderboard,
        monthlyLeaderboard: game.monthlyLeaderboard,
        gameType: game.gameType,
        feltrinelliGameId: game.feltrinelliGameId,
        timerDuration: game.timerDuration || 30,
        questionCount: game.questionCount || 10,
        difficulty: game.difficulty || 1
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
      {/* Rimuoviamo questo titolo duplicato */}
      {/* <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestione Giochi</h2>
        <Button 
          onClick={handleCreateGame}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <i className="fas fa-plus mr-2"></i>
          Nuovo Gioco
        </Button>
      </div> */}
      
      {/* Manteniamo solo il pulsante "Nuovo Gioco" */}
      <div className="flex justify-end mb-6">
        <Button 
          onClick={handleCreateGame}
          className="bg-blue-500 hover:bg-blue-600"
        >
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