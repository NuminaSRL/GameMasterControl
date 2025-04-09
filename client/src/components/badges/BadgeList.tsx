import { useQuery } from "@tanstack/react-query";
import { Badge } from '../../shared/schema';
import { Button } from "@/components/ui/button";

export default function BadgeList() {
  // Fetch badges data
  const { data: badges = [], isLoading } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <i className="fas fa-spinner fa-spin text-gray-500 mr-2"></i>
        <span>Caricamento badge...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Badge Recenti</h2>
      </div>
      <div className="p-6">
        <ul className="divide-y divide-gray-200">
          {badges.slice(0, 3).map((badge) => (
            <li key={badge.id} className="py-4 flex">
              <div className={`h-12 w-12 rounded-full bg-${badge.color}-100 flex items-center justify-center`}>
                <i className={`${badge.icon} text-${badge.color}-500`}></i>
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">{badge.name}</h3>
                  <span className="text-xs text-gray-500">10 assegnati</span>
                </div>
                <p className="text-sm text-gray-500">{badge.description}</p>
              </div>
            </li>
          ))}
          {badges.length === 0 && (
            <li className="py-4 text-center text-gray-500">
              Nessun badge disponibile
            </li>
          )}
        </ul>
        <div className="mt-4">
          <Button variant="outline" className="w-full">
            Visualizza tutti i badge
          </Button>
        </div>
      </div>
    </div>
  );
}
