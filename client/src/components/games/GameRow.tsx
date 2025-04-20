import { Game, Badge, Reward } from '../../shared/schema';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface GameRowProps {
  game: Game;
  onEdit: () => void;
  onToggle: () => void;
  onManageRewards?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  badges?: Badge[];
  rewards?: Reward[];
  rewardCounts?: {
    global: number;
    weekly: number;
    monthly: number;
  };
}

export default function GameRow({ 
  game, 
  onEdit, 
  onToggle, 
  onManageRewards,
  isExpanded = false,
  onToggleExpand,
  badges = [],
  rewards = [],
  rewardCounts = { global: 0, weekly: 0, monthly: 0 }
}: GameRowProps) {
  // Generate CSS classes for different game types
  const getIconClass = () => {
    if (game.name.toLowerCase().includes("quiz")) {
      return "fas fa-puzzle-piece";
    } else if (game.name.toLowerCase().includes("math")) {
      return "fas fa-calculator";
    } else if (game.name.toLowerCase().includes("music")) {
      return "fas fa-music";
    } else {
      return "fas fa-gamepad";
    }
  };

  // Formatta le date in un formato leggibile
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Non impostata";
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Traduci il tipo di gioco
  const getGameTypeLabel = (type: string) => {
    switch(type) {
      case 'books': return 'Libri';
      case 'authors': return 'Autori';
      case 'years': return 'Anni';
      default: return type;
    }
  };

  // Aggiungi questo log all'inizio della funzione per debug
  console.log(`Rendering GameRow for game ${game.name} with ID ${game.id}`, {
    rewards,
    rewardCounts
  });
  
  // Filtra i reward per tipo, assicurandoci che non ci siano duplicati
  const globalRewards = rewards.filter(r => 
    r.leaderboardType === 'global'
  );
  const weeklyRewards = rewards.filter(r => r.leaderboardType === 'weekly');
  const monthlyRewards = rewards.filter(r => r.leaderboardType === 'monthly');
  
  // Log dettagliato per debug
  console.log(`Game ${game.name} rewards:`, {
    total: rewards.length,
    globalRewards: globalRewards,
    weeklyRewards: weeklyRewards,
    monthlyRewards: monthlyRewards,
    global: globalRewards.length,
    weekly: weeklyRewards.length,
    monthly: monthlyRewards.length,
    rewardCounts
  });

  return (
    <>
      <tr className={`border-b ${isExpanded ? "bg-blue-50 border-blue-100" : "border-gray-200"}`}>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex items-center">
            <button 
              onClick={onToggleExpand}
              className={`mr-2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full ${isExpanded ? "bg-blue-100" : "hover:bg-gray-100"}`}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`}></i>
            </button>
            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-gray-200 flex items-center justify-center">
              <i className={`${getIconClass()} text-gray-500`}></i>
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-gray-900">{game.name}</div>
              <div className="text-xs text-gray-500 max-w-xs truncate">{game.description}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            game.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
          }`}>
            {game.isActive ? "Attivo" : "Inattivo"}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            game.difficulty === 1 || game.difficulty === 'Facile' ? "bg-green-100 text-green-800" : 
            game.difficulty === 2 || game.difficulty === 'Medio' ? "bg-yellow-100 text-yellow-800" : 
            "bg-red-100 text-red-800"
          }`}>
            {typeof game.difficulty === 'number' 
              ? (game.difficulty === 1 ? 'Facile' : game.difficulty === 2 ? 'Medio' : 'Difficile')
              : game.difficulty || 'N/D'}
          </span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          {game.timerDuration} sec
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          {game.questionCount}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          <div className="flex space-x-2">
            {game.weeklyLeaderboard && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${game.weeklyLeaderboard ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                      S
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{game.weeklyLeaderboard ? 'Classifica settimanale attiva' : 'Classifica settimanale non attiva'}</p>
                    {weeklyRewards.length > 0 && <p>{weeklyRewards.length} premi settimanali</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            {game.monthlyLeaderboard && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${game.monthlyLeaderboard ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'}`}>
                      M
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{game.monthlyLeaderboard ? 'Classifica mensile attiva' : 'Classifica mensile non attiva'}</p>
                    {monthlyRewards.length > 0 && <p>{monthlyRewards.length} premi mensili</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
          <div className="flex space-x-3">
            <button 
              className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-full transition-colors shadow-sm"
              onClick={onEdit}
              title="Modifica"
            >
              <i className="fas fa-edit text-sm"></i>
            </button>
            {onManageRewards && (
              <button 
                className="bg-purple-50 text-purple-600 hover:bg-purple-100 p-2 rounded-full transition-colors shadow-sm"
                onClick={onManageRewards}
                title="Gestisci Premi"
              >
                <i className="fas fa-gift text-sm"></i>
              </button>
            )}
            <button 
              className={`p-2 rounded-full transition-colors shadow-sm ${
                game.isActive 
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              }`}
              onClick={onToggle}
              title={game.isActive ? "Disattiva" : "Attiva"}
            >
              <i className={`fas ${game.isActive ? 'fa-toggle-off' : 'fa-toggle-on'} text-sm`}></i>
            </button>
          </div>
        </td>
      </tr>
      
      {isExpanded && (
        <tr className="bg-blue-50/30">
          <td colSpan={7} className="px-4 py-2 border-b">
            <div className="grid grid-cols-4 gap-4 py-2">
              {/* Card per le date */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <i className="fas fa-calendar-alt mr-2 text-blue-500"></i>
                  Date
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="font-medium">Inizio:</span> 
                    <span>{formatDate(game.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Fine:</span> 
                    <span>{formatDate(game.endDate)}</span>
                  </div>
                </div>
              </div>
              
              {/* Card per il tipo di gioco */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <i className="fas fa-gamepad mr-2 text-green-500"></i>
                  Tipo Gioco
                </h4>
                <div className="text-xs text-gray-600">
                  <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                    {getGameTypeLabel(game.gameType)}
                  </span>
                </div>
              </div>
              
              {/* Card per i badge */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <i className="fas fa-medal mr-2 text-purple-500"></i>
                  Badge
                </h4>
                <div className="flex flex-wrap gap-1">
                  {badges.length > 0 ? (
                    badges.map(badge => (
                      <span key={badge.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {badge.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Nessun badge assegnato</span>
                  )}
                </div>
              </div>
              
              {/* Card per i reward globali */}
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <i className="fas fa-trophy mr-2 text-amber-500"></i>
                  Premi Globali
                </h4>
                <div className="flex flex-wrap gap-1">
                  {globalRewards.length > 0 ? (
                    <span className="text-xs text-gray-700">
                      {globalRewards.length} premi globali
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">
                      Nessun premio globale
                    </span>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}