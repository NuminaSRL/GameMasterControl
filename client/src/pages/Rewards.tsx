import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reward } from "@/shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import EditRewardModal from "@/components/rewards/EditRewardModal";
import { Input } from "@/components/ui/input";

export default function Rewards() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch rewards
  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: ['/api/feltrinelli/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/feltrinelli/rewards');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Toggle reward status mutation
  const toggleRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const reward = rewards.find(r => r.id === rewardId);
      if (!reward) throw new Error('Reward not found');
      
      return await apiRequest(
        'PUT', 
        `/api/feltrinelli/rewards/${rewardId}/settings`, 
        { is_active: !reward.isActive }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Stato Premio Aggiornato",
        description: "Lo stato del premio è stato aggiornato con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile aggiornare lo stato del premio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    },
  });

  // Handle edit reward
  const handleEditReward = (reward: Reward) => {
    setCurrentReward(reward);
    setIsModalOpen(true);
  };

  // Handle toggle reward status
  const handleToggleRewardStatus = (rewardId: number) => {
    toggleRewardMutation.mutate(rewardId);
  };

  // Close modal
  const handleCloseModal = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/rewards'] });
    setIsModalOpen(false);
    setCurrentReward(null);
  };

  // Handle add new reward
  const handleAddReward = () => {
    setCurrentReward(null);
    setIsModalOpen(true);
  };

  // Filter rewards based on search term
  const filteredRewards = rewards.filter(reward => 
    reward.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reward.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestione Premi</h1>
        <Button onClick={handleAddReward}>
          <i className="fas fa-plus mr-2"></i> Nuovo Premio
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Tutti i Premi</h2>
          <div className="w-1/3">
            <Input
              placeholder="Cerca premio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredRewards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-gift text-gray-300 text-4xl mb-3"></i>
            <p>Nessun premio trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRewards.map((reward) => (
              <div key={reward.id} className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center mb-2">
                  <img 
                    src={reward.imageUrl || '/placeholder-reward.png'} 
                    alt={reward.name} 
                    className="w-16 h-16 object-cover rounded-md mr-3"
                  />
                  <div>
                    <h3 className="font-medium">{reward.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      reward.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {reward.isActive ? 'Attivo' : 'Inattivo'}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 flex-grow">{reward.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-semibold">{reward.points} punti</span>
                  <div>
                    <button
                      onClick={() => handleEditReward(reward)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Modifica premio"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleToggleRewardStatus(reward.id)}
                      className={`${
                        reward.isActive ? 'text-green-600 hover:text-green-900' : 'text-red-600 hover:text-red-900'
                      }`}
                      title={reward.isActive ? "Disattiva premio" : "Attiva premio"}
                    >
                      <i className={`fas ${reward.isActive ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <EditRewardModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        reward={currentReward} 
      />
    </div>
  );
}