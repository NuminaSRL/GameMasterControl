import { useQuery, useMutation } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import GameTable from "@/components/games/GameTable";
import BadgeList from "@/components/badges/BadgeList";
import RewardList from "@/components/rewards/RewardList";
import { Stats, Game } from '../shared/schema';
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import EditGameModal from "@/components/games/EditGameModal";

export default function Dashboard() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });
  
  // Fetch games
  // Update the query to use the Feltrinelli API endpoint
  const { data: games = [], isLoading: isLoadingGames } = useQuery<Game[]>({
    queryKey: ['/api/feltrinelli/games'],
    queryFn: async () => {
      console.log('Dashboard: Fetching games from Feltrinelli API');
      const response = await fetch('/api/feltrinelli/games');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      console.log('Dashboard: Fetched games from Feltrinelli API:', data);
      
      // Aggiungiamo un log per verificare i valori specifici
      if (data && data.length > 0) {
        console.log('Dashboard: Primo gioco timerDuration:', data[0].timerDuration);
      }
      
      return data;
    },
    // Aggiungiamo refetchInterval per forzare l'aggiornamento periodico
    refetchInterval: 5000, // Aggiorna ogni 5 secondi
    // Assicuriamoci che la cache venga invalidata correttamente
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Handle edit game
  const handleEditGame = (game: Game) => {
    console.log('Dashboard: Opening edit modal for game:', game);
    // Invalidate game settings query before opening modal
    queryClient.invalidateQueries({ 
      queryKey: [`/api/feltrinelli/game-settings/${game.id}`] 
    });
    console.log(`Dashboard: Invalidated /api/feltrinelli/game-settings/${game.id}`);
    setCurrentGame(game);
    setIsModalOpen(true);
  };

  // Toggle game status mutation
  // Update the toggle game mutation to use the Feltrinelli API
  const toggleGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      // Get the current game state
      const game = games.find(g => g.id === gameId);
      if (!game) throw new Error('Game not found');
      
      // Use the Feltrinelli endpoint to update settings
      return await apiRequest(
        'PUT', 
        `/api/feltrinelli/games/${gameId}/settings`, 
        { is_active: !game.isActive }
      );
    },
    onSuccess: () => {
      // Invalidate both old and new queries for compatibility
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/game-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      toast({
        title: "Game Status Updated",
        description: "The game status has been updated successfully.",
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

  // Handle toggle game status
  const handleToggleGameStatus = (gameId: number) => {
    toggleGameMutation.mutate(gameId);
  };

  // Close modal - manteniamo solo questa definizione
  const handleCloseModal = () => {
    // Forza un refresh dei dati quando si chiude la modale
    queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/games'] });
    console.log('Dashboard: Invalidated games query after modal close');
    
    setIsModalOpen(false);
    setCurrentGame(null);
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Giochi Totali"
          value={isLoadingStats ? 0 : stats?.totalGames || 0}
          icon="fas fa-gamepad"
          color="blue"
        />
        <StatsCard
          title="Giochi Attivi"
          value={isLoadingStats ? 0 : stats?.activeGames || 0}
          icon="fas fa-power-off"
          color="green"
        />
        <StatsCard
          title="Utenti Attivi"
          value={isLoadingStats ? 0 : stats?.activeUsers || 0}
          icon="fas fa-users"
          color="purple"
        />
        <StatsCard
          title="Badge Assegnati"
          value={isLoadingStats ? 0 : stats?.awardedBadges || 0}
          icon="fas fa-medal"
          color="yellow"
        />
      </div>

      {/* Games Table */}
      <div className="bg-white rounded-lg shadow-md mb-6 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Giochi Recenti</h2>
        {isLoadingGames ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <GameTable 
            games={games} 
            onEdit={handleEditGame} 
            onToggle={handleToggleGameStatus}
          />
        )}
      </div>
      
      <EditGameModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        game={currentGame} 
      />

      {/* Badges and Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <BadgeList />
        <RewardList />
      </div>
    </>
  );
}
