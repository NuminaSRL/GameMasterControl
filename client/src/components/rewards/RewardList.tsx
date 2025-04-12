import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Reward } from "@/shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditRewardModal from "./EditRewardModal";

// Questo componente mostrerà solo gli ultimi rewards nella dashboard
export default function RewardList() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);

  // Fetch rewards - limitiamo a 4 per la dashboard
  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: ['/api/feltrinelli/rewards'],
    queryFn: async () => {
      const response = await fetch('/api/feltrinelli/rewards');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const allRewards = await response.json();
      // Prendiamo solo i primi 4 rewards per la dashboard
      return allRewards.slice(0, 4);
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0
  });

  // Naviga alla pagina completa dei rewards
  const handleViewAllRewards = () => {
    setLocation('/rewards');
  };

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

  // Delete reward mutation
  const deleteRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      return await apiRequest('DELETE', `/api/feltrinelli/rewards/${rewardId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: "Premio Eliminato",
        description: "Il premio è stato eliminato con successo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile eliminare il premio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
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
  
  // Handle delete reward
  const handleDeleteReward = (rewardId: number) => {
    if (window.confirm("Sei sicuro di voler eliminare questo premio? Questa azione non può essere annullata.")) {
      deleteRewardMutation.mutate(rewardId);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Premi Recenti</CardTitle>
        <Button onClick={handleViewAllRewards} size="sm">
          <i className="fas fa-external-link-alt mr-2"></i> Vedi Tutti
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <i className="fas fa-gift text-gray-300 text-4xl mb-3"></i>
            <p>Nessun premio trovato</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((reward) => (
              <div key={reward.id} className="border rounded-lg p-4 flex flex-col">
                <div className="flex items-center mb-2">
                  <img 
                    src={reward.imageUrl || '/placeholder-reward.png'} 
                    alt={reward.name} 
                    className="w-12 h-12 object-cover rounded-md mr-3"
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
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 border-gray-300"
                      onClick={() => handleToggleRewardStatus(reward.id)}
                    >
                      {reward.isActive ? (
                        <i className="fas fa-toggle-on text-green-500 mr-1"></i>
                      ) : (
                        <i className="fas fa-toggle-off text-red-500 mr-1"></i>
                      )}
                      {reward.isActive ? 'Disattiva' : 'Attiva'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 border-gray-300"
                      onClick={() => handleEditReward(reward)}
                    >
                      <i className="fas fa-edit text-blue-500 mr-1"></i>
                      Modifica
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 border-gray-300 hover:bg-red-50"
                      onClick={() => handleDeleteReward(reward.id)}
                    >
                      <i className="fas fa-times text-red-500 mr-1"></i>
                      Elimina
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <EditRewardModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        reward={currentReward} 
      />
    </Card>
  );
}
