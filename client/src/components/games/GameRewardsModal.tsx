import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Game } from "../../shared/schema";

interface GameRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
}

interface Reward {
  id: number;
  name: string;
  description?: string;
  points: number;
  isActive: boolean;
  rank?: number;
  imageUrl?: string;
}

interface RewardAssociation {
  rewardId: number;
  position: number;
}

export default function GameRewardsModal({ isOpen, onClose, game }: GameRewardsModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"global" | "monthly" | "weekly">("global");
  
  // Stato per le associazioni con i premi
  const [rewardAssociations, setRewardAssociations] = useState<{
    weekly: RewardAssociation[];
    monthly: RewardAssociation[];
    global: RewardAssociation[];
  }>({
    weekly: [],
    monthly: [],
    global: []
  });

  // Fetch rewards - torniamo all'endpoint corretto per il recupero dei premi
  const { data: rewards = [], isLoading: isLoadingRewards } = useQuery<Reward[]>({
    queryKey: ['/api/feltrinelli/rewards', isOpen],
    queryFn: async () => {
      const timestamp = new Date().getTime();
      return apiRequest('GET', `/api/feltrinelli/rewards?_t=${timestamp}`);
    },
    enabled: isOpen,
    staleTime: 0, // Non usare la cache
    refetchOnWindowFocus: true, // Ricarica quando la finestra ottiene il focus
  });
  
  // Carica le associazioni esistenti quando si apre la modale
  useEffect(() => {
    if (game?.id && isOpen) {
      // Aggiungiamo un timestamp per evitare la cache
      const timestamp = new Date().getTime();
      
      // Correggiamo la chiamata apiRequest rimuovendo il quarto parametro
      apiRequest('GET', `/api/feltrinelli/games/${game.id}/rewards?_t=${timestamp}`)
        .then((data) => {
          console.log('Rewards data received:', data);
          // Verifica se data è un array
          const rewardsArray = Array.isArray(data) ? data : [];
          
          const associations = {
            weekly: rewardsArray
              .filter((r: any) => r.leaderboardType === 'weekly')
              .map((r: any) => ({ rewardId: r.id, position: r.position || 0 })),
            monthly: rewardsArray
              .filter((r: any) => r.leaderboardType === 'monthly')
              .map((r: any) => ({ rewardId: r.id, position: r.position || 0 })),
            global: rewardsArray
              .filter((r: any) => r.leaderboardType === 'global')
              .map((r: any) => ({ rewardId: r.id, position: r.position || 0 }))
          };
          
          console.log('Parsed associations:', associations);
          setRewardAssociations(associations);
        })
        .catch(err => {
          console.error("Error fetching reward associations:", err);
          // In caso di errore, non mostrare il toast ma solo log in console
          console.log("Silently failing and continuing with empty associations");
          setRewardAssociations({
            weekly: [],
            monthly: [],
            global: []
          });
        });
    } else {
      // Reset associations for new game
      setRewardAssociations({
        weekly: [],
        monthly: [],
        global: []
      });
    }
  }, [game, isOpen, toast]);

  // Gestisce la selezione/deselezione di un premio
  const handleRewardToggle = (reward: Reward, leaderboardType: 'weekly' | 'monthly' | 'global') => {
    setRewardAssociations(prev => {
      const newAssociations = { ...prev };
      const existingIndex = newAssociations[leaderboardType].findIndex(a => a.rewardId === reward.id);
      
      if (existingIndex >= 0) {
        // Rimuovi il premio se già presente
        newAssociations[leaderboardType] = newAssociations[leaderboardType].filter(a => a.rewardId !== reward.id);
      } else {
        // Aggiungi il premio con posizione predefinita (usa rank del premio se disponibile)
        const position = reward.rank || newAssociations[leaderboardType].length + 1;
        newAssociations[leaderboardType] = [
          ...newAssociations[leaderboardType], 
          { rewardId: reward.id, position }
        ];
      }
      
      return newAssociations;
    });
  };

  // Aggiorna la posizione di un premio
  const handlePositionChange = (rewardId: number, position: number, leaderboardType: 'weekly' | 'monthly' | 'global') => {
    setRewardAssociations(prev => {
      const newAssociations = { ...prev };
      const index = newAssociations[leaderboardType].findIndex(a => a.rewardId === rewardId);
      
      if (index >= 0) {
        newAssociations[leaderboardType][index].position = position;
      }
      
      return newAssociations;
    });
  };

  // Salva le associazioni
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!game?.id) return null;
      
      try {
        // Ottieni le associazioni attuali (o usa un array vuoto se fallisce)
        let currentAssociations = [];
        try {
          currentAssociations = await apiRequest('GET', `/api/feltrinelli/games/${game.id}/rewards`);
          if (!Array.isArray(currentAssociations)) {
            console.warn('Non-array response for current associations, defaulting to empty array');
            currentAssociations = [];
          }
        } catch (err) {
          console.warn('Error fetching current associations, defaulting to empty array:', err);
        }
        
        // Prepara le nuove associazioni
        const newAssociations = [
          ...rewardAssociations.weekly.map(a => ({ 
            rewardId: a.rewardId, 
            position: a.position, 
            leaderboardType: 'weekly' 
          })),
          ...rewardAssociations.monthly.map(a => ({ 
            rewardId: a.rewardId, 
            position: a.position, 
            leaderboardType: 'monthly' 
          })),
          ...rewardAssociations.global.map(a => ({ 
            rewardId: a.rewardId, 
            position: a.position, 
            leaderboardType: 'global' 
          }))
        ];
        
        console.log('New associations to save:', newAssociations);
        
        // Prima rimuoviamo tutte le associazioni esistenti
        await apiRequest('DELETE', `/api/feltrinelli/games/${game.id}/rewards`);
        
        // Poi creiamo le nuove associazioni
        for (const assoc of newAssociations) {
          await apiRequest('POST', `/api/feltrinelli/games/${game.id}/rewards/${assoc.rewardId}`, {
            leaderboardType: assoc.leaderboardType,
            position: assoc.position
          });
        }
        
        return true;
      } catch (error) {
        console.error("Error saving reward associations:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Premi associati",
        description: "Le associazioni dei premi sono state salvate con successo",
      });
      
      // Miglioramento dell'invalidazione delle query
      // Invalida tutte le query pertinenti con un pattern più ampio
      queryClient.invalidateQueries();
      
      // Forza il refetch dei dati specifici dopo un breve ritardo
      setTimeout(async () => {
        if (game?.id) {
          // Forza il refetch dei premi del gioco
          await queryClient.refetchQueries({ 
            queryKey: [`/api/feltrinelli/games/${game.id}/rewards`],
            exact: false 
          });
        }
        // Forza il refetch di tutti i giochi
        await queryClient.refetchQueries({ 
          queryKey: ['/api/feltrinelli/games'],
          exact: false 
        });
        // Forza il refetch di tutti i premi
        await queryClient.refetchQueries({ 
          queryKey: ['/api/feltrinelli/rewards'],
          exact: false 
        });
      }, 200);
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile salvare le associazioni: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    },
  });



  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center">
            <i className="fas fa-trophy mr-2 text-yellow-500"></i>
            Associa Premi - {game?.name || ''}
          </DialogTitle>
        </DialogHeader>
      
        <div className="py-4">
          <Tabs defaultValue="global" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid grid-cols-3 mb-4 bg-gray-100 p-1 rounded-lg">
              <TabsTrigger 
                value="global" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-md transition-all font-medium"
              >
                <i className="fas fa-globe mr-2"></i>
                Classifica Globale
              </TabsTrigger>
              <TabsTrigger 
                value="monthly" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-md transition-all font-medium"
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Classifica Mensile
              </TabsTrigger>
              <TabsTrigger 
                value="weekly" 
                className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 rounded-md transition-all font-medium"
              >
                <i className="fas fa-calendar-week mr-2"></i>
                Classifica Settimanale
              </TabsTrigger>
            </TabsList>
            
            {/* Tab Classifica Globale */}
            <TabsContent value="global" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
                <p className="flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  Seleziona i premi da assegnare nella classifica globale e imposta la posizione in classifica.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {rewards.filter(r => r.isActive).map(reward => {
                  const association = rewardAssociations.global.find(a => a.rewardId === reward.id);
                  return (
                    <Card key={`global-${reward.id}`} className={association ? "border-primary border-2" : ""}>
                      <CardContent className="p-3 flex items-center space-x-3">
                        <Checkbox 
                          id={`global-${reward.id}`}
                          checked={!!association}
                          onCheckedChange={() => handleRewardToggle(reward, 'global')}
                          className="h-5 w-5"
                        />
                        
                        {/* Immagine del premio */}
                        <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                          {reward.imageUrl ? (
                            <img 
                              src={reward.imageUrl} 
                              alt={reward.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <i className="fas fa-award text-xl"></i>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{reward.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <i className="fas fa-star text-yellow-500 mr-1"></i>
                            {reward.points} punti
                          </div>
                          {reward.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{reward.description}</div>
                          )}
                        </div>
                        
                        {association && (
                          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                            <Label htmlFor={`global-pos-${reward.id}`} className="text-sm whitespace-nowrap">Posizione:</Label>
                            <Input 
                              id={`global-pos-${reward.id}`}
                              type="number" 
                              min="1"
                              value={association.position}
                              onChange={(e) => handlePositionChange(reward.id, parseInt(e.target.value) || 1, 'global')}
                              className="w-16 h-8"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            {/* Tab Classifica Mensile - Applica le stesse modifiche */}
            <TabsContent value="monthly" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
                <p className="flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  Seleziona i premi da assegnare nella classifica mensile e imposta la posizione in classifica.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {rewards.filter(r => r.isActive).map(reward => {
                  const association = rewardAssociations.monthly.find(a => a.rewardId === reward.id);
                  return (
                    <Card key={`monthly-${reward.id}`} className={association ? "border-primary border-2" : ""}>
                      <CardContent className="p-3 flex items-center space-x-3">
                        <Checkbox 
                          id={`monthly-${reward.id}`}
                          checked={!!association}
                          onCheckedChange={() => handleRewardToggle(reward, 'monthly')}
                          className="h-5 w-5"
                        />
                        
                        {/* Immagine del premio */}
                        <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                          {reward.imageUrl ? (
                            <img 
                              src={reward.imageUrl} 
                              alt={reward.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <i className="fas fa-award text-xl"></i>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{reward.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <i className="fas fa-star text-yellow-500 mr-1"></i>
                            {reward.points} punti
                          </div>
                          {reward.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{reward.description}</div>
                          )}
                        </div>
                        
                        {association && (
                          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                            <Label htmlFor={`monthly-pos-${reward.id}`} className="text-sm whitespace-nowrap">Posizione:</Label>
                            <Input 
                              id={`monthly-pos-${reward.id}`}
                              type="number" 
                              min="1"
                              value={association.position}
                              onChange={(e) => handlePositionChange(reward.id, parseInt(e.target.value) || 1, 'monthly')}
                              className="w-16 h-8"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            {/* Tab Classifica Settimanale - Applica le stesse modifiche */}
            <TabsContent value="weekly" className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700 mb-4">
                <p className="flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  Seleziona i premi da assegnare nella classifica settimanale e imposta la posizione in classifica.
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                {rewards.filter(r => r.isActive).map(reward => {
                  const association = rewardAssociations.weekly.find(a => a.rewardId === reward.id);
                  return (
                    <Card key={`weekly-${reward.id}`} className={association ? "border-primary border-2" : ""}>
                      <CardContent className="p-3 flex items-center space-x-3">
                        <Checkbox 
                          id={`weekly-${reward.id}`}
                          checked={!!association}
                          onCheckedChange={() => handleRewardToggle(reward, 'weekly')}
                          className="h-5 w-5"
                        />
                        
                        {/* Immagine del premio - Aggiunta qui */}
                        <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                          {reward.imageUrl ? (
                            <img 
                              src={reward.imageUrl} 
                              alt={reward.name} 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400">
                              <i className="fas fa-award text-xl"></i>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="font-medium">{reward.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <i className="fas fa-star text-yellow-500 mr-1"></i>
                            {reward.points} punti
                          </div>
                          {reward.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">{reward.description}</div>
                          )}
                        </div>
                        {association && (
                          <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md">
                            <Label htmlFor={`weekly-pos-${reward.id}`} className="text-sm whitespace-nowrap">Posizione:</Label>
                            <Input 
                              id={`weekly-pos-${reward.id}`}
                              type="number" 
                              min="1"
                              value={association.position}
                              onChange={(e) => handlePositionChange(reward.id, parseInt(e.target.value) || 1, 'weekly')}
                              className="w-16 h-8"
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="border-t pt-4 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-gray-300"
            disabled={saveMutation.isPending}
          >
            <i className="fas fa-times mr-2"></i>
            Annulla
          </Button>
          <Button 
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Salvataggio...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Salva Associazioni
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}