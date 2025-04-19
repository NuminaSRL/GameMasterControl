import { useState } from "react";
import { Game } from '../../shared/schema';
import GameRow from './GameRow';

interface GameTableProps {
  games: Game[];
  onEdit: (game: Game) => void;
  onToggle: (gameId: number) => void;
  isLoading?: boolean;
  onManageRewards?: (game: Game) => void; // Aggiunta questa proprietà opzionale
}

export default function GameTable({ games, onEdit, onToggle, onManageRewards, isLoading = false }: GameTableProps) {
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
          {games.map((game) => (
            <GameRow 
              key={game.id} 
              game={game} 
              onEdit={() => onEdit(game)} 
              onToggle={() => onToggle(game.id)}
              onManageRewards={onManageRewards ? () => onManageRewards(game) : undefined}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
