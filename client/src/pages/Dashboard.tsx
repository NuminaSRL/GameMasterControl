import { useQuery, useMutation } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import GameTable from "@/components/games/GameTable";
import BadgeList from "@/components/badges/BadgeList";
import RewardList from "@/components/rewards/RewardList";
import { Stats, Game } from "@shared/schema";
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
  const { data: games = [], isLoading: isLoadingGames } = useQuery<Game[]>({
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
