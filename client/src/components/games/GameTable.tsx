import { useState, Fragment, useEffect } from "react";
import { Game, Badge, Reward } from '../../shared/schema';
import GameRow from './GameRow';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onToggle: (gameId: number) => void;
  isLoading?: boolean;
  onManageRewards?: (game: Game) => void;
  badges?: Badge[]; // Badge per poterli visualizzare
  rewards?: Reward[]; // Aggiungiamo i reward per poterli visualizzare
}

export default function GameTable({ 
  games, 
  onEdit, 
  onToggle, 
  onManageRewards, 
  isLoading = false,
  badges = [],
  rewards = []
}: GameTableProps) {
  // Stato per tenere traccia delle righe espanse
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  // Stato per memorizzare i premi per ogni gioco
  const [gameRewards, setGameRewards] = useState<Record<number, Reward[]>>({});
  
  // Funzione per gestire l'espansione/compressione di una riga
  const toggleRowExpansion = (gameId: number) => {
    setExpandedRows(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId) 
        : [...prev, gameId]
    );
    
    // Carica i premi quando si espande una riga se non sono già stati caricati
    if (!gameRewards[gameId] && !expandedRows.includes(gameId)) {
      fetchGameRewardsById(gameId);
    }
  };

  // Funzione per caricare i premi di un gioco specifico usando l'ID
  const fetchGameRewardsById = async (gameId: number) => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/feltrinelli/games/${gameId}/rewards?_t=${timestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Game ${gameId} rewards from API:`, data);
        
        // Memorizza i premi usando l'ID del gioco
        setGameRewards(prev => ({
          ...prev,
          [gameId]: data
        }));
      } else {
        console.error(`Failed to load rewards for game ${gameId}`);
      }
    } catch (error) {
      console.error(`Error loading rewards for game ${gameId}:`, error);
    }
  };

  // Funzione per caricare i premi di un gioco specifico usando l'oggetto Game
  const fetchGameRewards = async (game: Game) => {
    await fetchGameRewardsById(game.id);
  };

  // Carica i premi per tutti i giochi all'avvio
  useEffect(() => {
    const loadAllRewards = async () => {
      for (const game of games) {
        await fetchGameRewards(game);
      }
    };
    
    loadAllRewards();
  }, [games]);

  // Funzione per ottenere i badge di un gioco
  const getGameBadges = (gameId: number) => {
    return badges.filter(badge => badge.game_id === gameId);
  };
  
  // Funzione per ottenere i reward di un gioco
  const getGameRewards = (gameId: number) => {
    // Usa i premi caricati specificamente per questo gioco
    const gameSpecificRewards = gameRewards[gameId] || [];
    
    // Filtriamo correttamente i premi per tipo
    const globalRewards = gameSpecificRewards.filter(r => r.leaderboardType === 'global');
    const weeklyRewards = gameSpecificRewards.filter(r => r.leaderboardType === 'weekly');
    const monthlyRewards = gameSpecificRewards.filter(r => r.leaderboardType === 'monthly');
    
    // Count rewards by type
    const rewardCounts = {
      global: globalRewards.length,
      weekly: weeklyRewards.length,
      monthly: monthlyRewards.length
    };
    
    console.log(`Game ${gameId} rewards from state:`, {
      total: gameSpecificRewards.length,
      globalRewards,
      weeklyRewards,
      monthlyRewards,
      counts: rewardCounts
    });
    
    return {
      rewards: gameSpecificRewards,
      globalRewards,
      weeklyRewards,
      monthlyRewards,
      counts: rewardCounts
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        Nessun gioco trovato.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome Gioco
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stato
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Difficoltà
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timer
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Domande
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Classifiche
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {games.map((game) => {
            const { rewards: gameSpecificRewards, counts } = getGameRewards(game.id);
            
            return (
              <Fragment key={game.id}>
                <GameRow 
                  game={game} 
                  onEdit={() => onEdit(game)} 
                  onToggle={() => onToggle(game.id)}
                  onManageRewards={onManageRewards ? () => onManageRewards(game) : undefined}
                  isExpanded={expandedRows.includes(game.id)}
                  onToggleExpand={() => toggleRowExpansion(game.id)}
                  badges={getGameBadges(game.id)}
                  rewards={gameSpecificRewards}
                  rewardCounts={counts}
                />
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Funzione helper per formattare le date
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "Non impostata";
  const date = new Date(dateString);
  return date.toLocaleString('it-IT', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
