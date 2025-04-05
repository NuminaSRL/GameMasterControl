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
  };

  // Create form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

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
        badges: gameBadges.map(badge => badge.id),
      });
    }
  }, [isOpen, game, gameBadges, form]);

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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifica Gioco' : 'Nuovo Gioco'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome del Gioco</FormLabel>
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
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descrizione del gioco" 
                      rows={2}
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
                    <FormLabel>Timer (secondi)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        min={5}
                        placeholder="30"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="questionCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero Domande</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        min={1}
                        placeholder="10"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
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

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox 
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="cursor-pointer">Gioco Attivo</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Annulla
              </Button>
              <Button 
                type="submit"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Salvataggio...
                  </>
                ) : (
                  'Salva'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
