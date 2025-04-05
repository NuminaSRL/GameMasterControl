import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/dashboard/StatsCard";
import GameTable from "@/components/games/GameTable";
import BadgeList from "@/components/badges/BadgeList";
import RewardList from "@/components/rewards/RewardList";
import { Stats } from "@shared/schema";

export default function Dashboard() {
  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

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
      <GameTable />

      {/* Badges and Rewards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <BadgeList />
        <RewardList />
      </div>
    </>
  );
}
