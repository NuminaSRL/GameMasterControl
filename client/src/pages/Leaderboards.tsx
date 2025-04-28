import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Game } from "../shared/schema";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  game_id: string;
  points: number;
  users: {
    username: string;
    avatar_url: string;
  };
}

interface LeaderboardResponse {
  data: LeaderboardEntry[];
}

export default function Leaderboards() {
  const [selectedGame, setSelectedGame] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all_time");
  
  // Fetch active games
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ['/api/feltrinelli/games'],
    queryFn: async () => {
      const response = await fetch('/api/feltrinelli/games');
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      return data.filter((game: Game) => game.isActive);
    },
  });

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading } = useQuery<LeaderboardResponse>({
    queryKey: ['/api/feltrinelli/leaderboard', selectedGame, selectedPeriod],
    queryFn: async () => {
      let url = '/api/feltrinelli/leaderboard';
      
      // If a specific game is selected, use the game-specific endpoint
      if (selectedGame !== "all") {
        url = `/api/feltrinelli/leaderboard/${selectedGame}`;
      }
      
      url += `?period=${selectedPeriod}&limit=20`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      return response.json();
    },
    enabled: games.length > 0,
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Leaderboards</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Game</label>
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger>
              <SelectValue placeholder="Select a game" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              {games.map((game) => (
                <SelectItem key={game.feltrinelliGameId} value={game.feltrinelliGameId}>
                  {game.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select a period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedGame === "all" ? "Global Leaderboard" : 
              `${games.find(g => g.feltrinelliGameId === selectedGame)?.name || "Game"} Leaderboard`}
            {" - "}
            {selectedPeriod === "all_time" ? "All Time" : 
              selectedPeriod === "monthly" ? "Monthly" : "Weekly"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : leaderboardData?.data && leaderboardData.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboardData.data.map((entry, index) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {entry.users.avatar_url && (
                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                              <img 
                                className="h-10 w-10 rounded-full" 
                                src={entry.users.avatar_url} 
                                alt={entry.users.username} 
                              />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.users.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {entry.user_id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500">
              No leaderboard data available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}