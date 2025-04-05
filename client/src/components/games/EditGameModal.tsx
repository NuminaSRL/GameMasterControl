import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Game, Badge, insertGameSchema } from "@shared/schema";

interface EditGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
}

// Create a form schema based on the insertGameSchema
const formSchema = insertGameSchema.extend({
  badges: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditGameModal({ isOpen, onClose, game }: EditGameModalProps) {
  const { toast } = useToast();
  const isEditing = !!game;
  const [gameIds, setGameIds] = useState<{books: string; authors: string; years: string} | null>(null);
  
  // Utility to ensure a string is never null
  const ensureString = (value: string | null | undefined): string => {
    return value || '';
  };

  // Fetch all badges
  const { data: allBadges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
    enabled: isOpen,
  });

  // Fetch badges for this game if editing
  const { data: gameBadges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/games', game?.id, 'badges'],
    enabled: isOpen && isEditing,
  });

  // Default form values
  const defaultValues: FormValues = {
    name: game?.name || '',
    description: game?.description || '',
    isActive: game?.isActive ?? true,
    timerDuration: game?.timerDuration || 30,
    questionCount: game?.questionCount || 10,
    weeklyLeaderboard: game?.weeklyLeaderboard ?? true,
    monthlyLeaderboard: game?.monthlyLeaderboard ?? true,
    reward: game?.reward || 'points_100',
    gameType: (game?.gameType as "books" | "authors" | "years") || 'books',
    feltrinelliGameId: game?.feltrinelliGameId || '00000000-0000-0000-0000-000000000001',
    difficulty: game?.difficulty || 1,
  };

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Fetch game IDs when modal opens
  useEffect(() => {
    if (isOpen) {
      // Fetch game IDs
      fetch('/api/feltrinelli/game-ids')
        .then(res => res.json())
        .then(data => {
          setGameIds(data);
        })
        .catch(error => {
          console.error('Failed to fetch game IDs:', error);
          toast({
            title: "Errore",
            description: "Non è stato possibile recuperare gli ID dei giochi",
            variant: "destructive",
          });
        });
    }
  }, [isOpen, toast]);

  // Reset form when game changes
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: game?.name || '',
        description: game?.description || '',
        isActive: game?.isActive ?? true,
        timerDuration: game?.timerDuration || 30,
        questionCount: game?.questionCount || 10,
        weeklyLeaderboard: game?.weeklyLeaderboard ?? true,
        monthlyLeaderboard: game?.monthlyLeaderboard ?? true,
        reward: game?.reward || 'points_100',
        gameType: (game?.gameType as "books" | "authors" | "years") || 'books',
        feltrinelliGameId: game?.feltrinelliGameId || '00000000-0000-0000-0000-000000000001',
        difficulty: game?.difficulty || 1,
        badges: gameBadges.map(badge => badge.id),
      });
    }
  }, [isOpen, game, gameBadges, form]);
  
  // Update feltrinelliGameId when gameType changes
  useEffect(() => {
    if (gameIds) {
      const gameType = form.watch('gameType');
      if (gameType) {
        const feltrinelliGameId = gameIds[gameType as keyof typeof gameIds];
        form.setValue('feltrinelliGameId', feltrinelliGameId || '');
      }
    }
  }, [gameIds, form]);

  // Save game mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const { badges, ...gameData } = data;

      if (isEditing && game) {
        // Update existing game
        const res = await apiRequest('PATCH', `/api/games/${game.id}`, gameData);
        const updatedGame = await res.json();

        // Update badges if provided
        if (badges) {
          // First, get existing badges
          const existingBadgeIds = gameBadges.map(badge => badge.id);
          
          // Find badges to add
          const badgesToAdd = badges.filter(id => !existingBadgeIds.includes(id));
          
          // Find badges to remove
          const badgesToRemove = existingBadgeIds.filter(id => !badges.includes(id));
          
          // Add new badges
          await Promise.all(
            badgesToAdd.map(badgeId => 
              apiRequest('POST', `/api/games/${game.id}/badges/${badgeId}`, undefined)
            )
          );
          
          // Remove badges
          await Promise.all(
            badgesToRemove.map(badgeId => 
              apiRequest('DELETE', `/api/games/${game.id}/badges/${badgeId}`, undefined)
            )
          );
        }

        return updatedGame;
      } else {
        // Create new game
        const res = await apiRequest('POST', '/api/games', gameData);
        const newGame = await res.json();
        
        // Assign badges if provided
        if (badges && badges.length > 0) {
          await Promise.all(
            badges.map(badgeId => 
              apiRequest('POST', `/api/games/${newGame.id}/badges/${badgeId}`, undefined)
            )
          );
        }

        return newGame;
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Gioco aggiornato" : "Gioco creato",
        description: isEditing 
          ? "Il gioco è stato aggiornato con successo"
          : "Il nuovo gioco è stato creato con successo",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile ${isEditing ? 'aggiornare' : 'creare'} il gioco: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: FormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-xl font-bold flex items-center">
            <i className={`fas fa-${isEditing ? 'edit' : 'plus'} mr-2 text-blue-500`}></i>
            {isEditing ? 'Modifica Gioco' : 'Nuovo Gioco'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-3">
            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-700 border border-blue-100">
              <div className="flex items-center">
                <i className="fas fa-info-circle mr-2 text-blue-500"></i>
                <p>Configura i dettagli principali del gioco. Puoi modificare questi parametri in qualsiasi momento.</p>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <i className="fas fa-gamepad mr-1.5 text-gray-500"></i>
                    Nome del Gioco
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Quiz Generale" />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <i className="fas fa-align-left mr-1.5 text-gray-500"></i>
                    Descrizione
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descrizione del gioco" 
                      rows={2}
                      className="resize-none"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timerDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <i className="fas fa-clock mr-1.5 text-gray-500"></i>
                      Timer (secondi)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        min={5}
                        placeholder="30"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="font-medium"
                      />
                    </FormControl>
                    <FormDescription>Tempo a disposizione per rispondere</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      <i className="fas fa-question-circle mr-1.5 text-gray-500"></i>
                      Numero Domande
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        min={1}
                        placeholder="10"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="font-medium"
                      />
                    </FormControl>
                    <FormDescription>Quante domande per partita</FormDescription>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="weeklyLeaderboard"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Classifica Settimanale</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monthlyLeaderboard"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Classifica Mensile</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gameType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo di Gioco</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Update feltrinelliGameId when gameType changes
                        if (gameIds && value) {
                          const feltrinelliGameId = gameIds[value as keyof typeof gameIds];
                          form.setValue('feltrinelliGameId', feltrinelliGameId || '');
                        }
                      }} 
                      defaultValue={ensureString(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="books">Quiz Libri</SelectItem>
                        <SelectItem value="authors">Quiz Autori</SelectItem>
                        <SelectItem value="years">Quiz Anni</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Tipo di quiz fornito da Feltrinelli</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficoltà</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={typeof field.value !== 'undefined' ? field.value.toString() : '1'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona la difficoltà" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Facile</SelectItem>
                        <SelectItem value="2">Media</SelectItem>
                        <SelectItem value="3">Difficile</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="feltrinelliGameId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Gioco Feltrinelli</FormLabel>
                  <FormControl>
                    <Input value={ensureString(field.value)} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} readOnly />
                  </FormControl>
                  <FormDescription>
                    Questo ID viene generato automaticamente in base al tipo di gioco selezionato.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reward"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premio</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un premio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="points_100">100 Punti</SelectItem>
                      <SelectItem value="points_200">200 Punti</SelectItem>
                      <SelectItem value="points_500">500 Punti</SelectItem>
                      <SelectItem value="premium_1day">Premium per 1 giorno</SelectItem>
                      <SelectItem value="premium_1week">Premium per 1 settimana</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="badges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge Assegnabili</FormLabel>
                  <div className="space-y-1">
                    {allBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`badge-${badge.id}`}
                          checked={field.value?.includes(badge.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              field.onChange([...(field.value || []), badge.id]);
                            } else {
                              field.onChange(
                                field.value?.filter((value) => value !== badge.id) || []
                              );
                            }
                          }}
                        />
                        <label
                          htmlFor={`badge-${badge.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {badge.name}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormDescription>
                    Seleziona i badge che possono essere assegnati in questo gioco.
                  </FormDescription>
                </FormItem>
              )}
            />

            <div className="bg-gray-50 p-4 rounded-lg my-4 border">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer text-base">
                        <i className={`fas ${field.value ? 'fa-toggle-on text-green-500' : 'fa-toggle-off text-gray-400'} mr-2`}></i>
                        Gioco Attivo
                      </FormLabel>
                      <FormDescription>
                        {field.value 
                          ? "Il gioco è visibile e giocabile dagli utenti." 
                          : "Il gioco non sarà visibile o giocabile finché non viene attivato."}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
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
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvataggio...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    {isEditing ? 'Aggiorna' : 'Crea Gioco'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
