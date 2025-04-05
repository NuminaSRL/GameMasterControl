import { Game } from "@shared/schema";

interface GameRowProps {
  game: Game;
  onEdit: () => void;
  onToggle: () => void;
}

export default function GameRow({ game, onEdit, onToggle }: GameRowProps) {
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

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
            <i className={`${getIconClass()} text-gray-500`}></i>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{game.name}</div>
            <div className="text-sm text-gray-500">{game.description}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          game.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        }`}>
          {game.isActive ? "Attivo" : "Inattivo"}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {game.timerDuration} secondi
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {game.questionCount}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div>
          Settimanali: {" "}
          {game.weeklyLeaderboard ? (
            <i className="fas fa-check text-green-500"></i>
          ) : (
            <i className="fas fa-times text-red-500"></i>
          )}
        </div>
        <div>
          Mensili: {" "}
          {game.monthlyLeaderboard ? (
            <i className="fas fa-check text-green-500"></i>
          ) : (
            <i className="fas fa-times text-red-500"></i>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button 
          className="text-primary hover:text-blue-700 mr-3"
          onClick={onEdit}
        >
          <i className="fas fa-edit"></i>
        </button>
        <button 
          className={`${
            game.isActive 
              ? "text-danger hover:text-red-700"
              : "text-success hover:text-green-700"
          }`}
          onClick={onToggle}
        >
          <i className="fas fa-power-off"></i>
        </button>
      </td>
    </tr>
  );
}
