import { Game } from '../../shared/schema';

interface GameRowProps {
  game: Game;
  onEdit: () => void;
  onToggle: () => void;
  onManageRewards?: () => void; // Aggiunta questa proprietà opzionale
}

export default function GameRow({ game, onEdit, onToggle, onManageRewards }: GameRowProps) {
  // Log dei dati del gioco per debug
  console.log('GameRow rendering with game data:', game);
  
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

  return (
    <tr>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center">
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
          {game.weeklyLeaderboard && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">S</span>}
          {game.monthlyLeaderboard && <span className="text-xs bg-purple-100 text-purple-800 px-1 rounded">M</span>}
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
  );
}
