import { useQuery } from "@tanstack/react-query";
import { Reward } from '../../shared/schema';
import { Button } from "@/components/ui/button";

export default function RewardList() {
  // Fetch rewards data
  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: ['/api/rewards'],
  });

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <i className="fas fa-spinner fa-spin text-gray-500 mr-2"></i>
        <span>Caricamento premi...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Premi Disponibili</h2>
      </div>
      <div className="p-6">
        <ul className="divide-y divide-gray-200">
          {rewards.slice(0, 3).map((reward) => (
            <li key={reward.id} className="py-4 flex">
              <div className={`h-12 w-12 rounded-full bg-${reward.color}-100 flex items-center justify-center`}>
                <i className={`${reward.icon} text-${reward.color}-500`}></i>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{reward.name}</h3>
                  <span className="text-xs text-gray-500">{reward.available} disponibili</span>
                </div>
                <p className="text-sm text-gray-500">{reward.description}</p>
              </div>
            </li>
          ))}
          {rewards.length === 0 && (
            <li className="py-4 text-center text-gray-500">
              Nessun premio disponibile
            </li>
          )}
        </ul>
        <div className="mt-4">
          <Button variant="outline" className="w-full">
            Gestisci tutti i premi
          </Button>
        </div>
      </div>
    </div>
  );
}
