import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy, Award, Gift, Plus, Edit, Trash2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryClient } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Interface for Feltrinelli Rewards from API
interface FeltrinelliReward {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_required: number;
  rank: number;
}

// Interface for custom rewards from our DB
interface CustomReward {
  id: number;
  name: string;
  description: string;
  type: string;
  value: string;
  rank: number;
  imageUrl: string | null;
  icon: string;
  color: string;
  available: number;
  gameType: 'books' | 'authors' | 'years';
  feltrinelliRewardId: string | null;
  createdAt: string;
}

// Schema for reward form
const rewardFormSchema = z.object({
  name: z.string().min(3, "Il nome deve essere di almeno 3 caratteri"),
  description: z.string().min(10, "La descrizione deve essere di almeno 10 caratteri"),
  type: z.string().min(1, "Seleziona un tipo di premio"),
  value: z.string().min(1, "Il valore non può essere vuoto"),
  rank: z.number().min(1, "Il rank deve essere almeno 1").max(20, "Il rank non può superare 20"),
  imageUrl: z.string().nullable(),
  icon: z.string().min(1, "Seleziona un'icona"),
  color: z.string().min(1, "Seleziona un colore"),
  available: z.number().min(0, "La disponibilità non può essere negativa"),
  gameType: z.enum(["books", "authors", "years"], {
    required_error: "Seleziona un tipo di gioco",
  }),
  feltrinelliRewardId: z.string().nullable(),
});

export default function RewardsPage() {
  const [gameType, setGameType] = useState<"books" | "authors" | "years">("books");
  const [period, setPeriod] = useState<"all_time" | "monthly" | "weekly">("all_time");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentReward, setCurrentReward] = useState<CustomReward | null>(null);
  const { toast } = useToast();

  // Fetch rewards from Feltrinelli API
  const { data: feltrinelliRewards = [], isLoading: isLoadingFeltrinelli } = useQuery<FeltrinelliReward[]>({
    queryKey: [`/api/feltrinelli/rewards?gameType=${gameType}&period=${period}`],
    refetchOnWindowFocus: false,
  });
  
  // Fetch custom rewards from our DB
  const { data: customRewards = [], isLoading: isLoadingCustom } = useQuery<CustomReward[]>({
    queryKey: ['/api/rewards'],
    refetchOnWindowFocus: false,
  });

  // Filter Feltrinelli rewards based on search query
  const filteredFeltrinelliRewards = feltrinelliRewards.filter(
    (reward) =>
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter custom rewards based on search query
  const filteredCustomRewards = customRewards.filter(
    (reward) =>
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Form for new/edit reward
  const form = useForm<z.infer<typeof rewardFormSchema>>({
    resolver: zodResolver(rewardFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "discount",
      value: "",
      rank: 10,
      imageUrl: null,
      icon: "gift",
      color: "#3b82f6",
      available: 100,
      gameType: "books",
      feltrinelliRewardId: null,
    },
  });

  // Handle creation/edit of reward
  const onSubmit = async (data: z.infer<typeof rewardFormSchema>) => {
    try {
      if (currentReward) {
        // Edit existing reward
        await fetch(`/api/rewards/${currentReward.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        toast({
          title: "Premio aggiornato",
          description: "Il premio è stato aggiornato con successo",
        });
      } else {
        // Create new reward
        await fetch("/api/rewards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        toast({
          title: "Premio creato",
          description: "Il nuovo premio è stato creato con successo",
        });
      }
      
      // Reset form and close dialog
      setIsEditDialogOpen(false);
      setCurrentReward(null);
      form.reset();
      
      // Refresh rewards list
      queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il salvataggio del premio",
        variant: "destructive",
      });
    }
  };

  // Handle reward edit
  const handleEditReward = (reward: CustomReward) => {
    setCurrentReward(reward);
    form.reset({
      name: reward.name,
      description: reward.description,
      type: reward.type,
      value: reward.value,
      rank: reward.rank,
      imageUrl: reward.imageUrl,
      icon: reward.icon,
      color: reward.color,
      available: reward.available,
      gameType: reward.gameType,
      feltrinelliRewardId: reward.feltrinelliRewardId,
    });
    setIsEditDialogOpen(true);
  };

  // Handle reward delete
  const handleDeleteReward = async (id: number) => {
    if (confirm("Sei sicuro di voler eliminare questo premio?")) {
      try {
        await fetch(`/api/rewards/${id}`, {
          method: "DELETE",
        });
        toast({
          title: "Premio eliminato",
          description: "Il premio è stato eliminato con successo",
        });
        
        // Refresh rewards list
        queryClient.invalidateQueries({ queryKey: ['/api/rewards'] });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante l'eliminazione del premio",
          variant: "destructive",
        });
      }
    }
  };

  // Create new reward
  const handleNewReward = () => {
    setCurrentReward(null);
    form.reset({
      name: "",
      description: "",
      type: "discount",
      value: "",
      rank: 10,
      imageUrl: null,
      icon: "gift",
      color: "#3b82f6",
      available: 100,
      gameType: "books",
      feltrinelliRewardId: null,
    });
    setIsEditDialogOpen(true);
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      form.setValue("imageUrl", base64String);
    };
    reader.readAsDataURL(file);
  };

  // Get icon component based on reward rank
  const getRewardIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-10 w-10 text-yellow-500" />;
      case 2:
        return <Award className="h-10 w-10 text-gray-400" />;
      case 3:
        return <Award className="h-10 w-10 text-amber-700" />;
      default:
        return <Gift className="h-10 w-10 text-blue-500" />;
    }
  };
  
  // Get background color based on reward rank
  const getRewardBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-50";
      case 2:
        return "bg-gray-50";
      case 3:
        return "bg-amber-50";
      default:
        return "bg-blue-50";
    }
  };

  // Helper function to translate period to Italian
  const translatePeriod = (p: string) => {
    switch (p) {
      case "all_time":
        return "Generale";
      case "monthly":
        return "Mensile";
      case "weekly":
        return "Settimanale";
      default:
        return p;
    }
  };

  // Helper function to translate game type to Italian
  const translateGameType = (gt: string) => {
    switch (gt) {
      case "books":
        return "Quiz Libri";
      case "authors":
        return "Quiz Autori";
      case "years":
        return "Quiz Anni";
      default:
        return gt;
    }
  };

  return (
    <div className="container py-6">
      <div>
        <h1 className="text-3xl font-bold">Premi</h1>
        <p className="text-muted-foreground">
          Visualizza e gestisci i premi disponibili per le classifiche dei giochi
        </p>
      </div>

      <Tabs defaultValue="feltrinelli" className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="feltrinelli">Premi Feltrinelli</TabsTrigger>
          <TabsTrigger value="custom">Premi Personalizzati</TabsTrigger>
        </TabsList>
        
        <TabsContent value="feltrinelli" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Premi Feltrinelli</CardTitle>
              <CardDescription>
                Questi premi sono forniti dall'API di Feltrinelli e vengono assegnati in base alle posizioni in classifica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="gameType">Tipo di Gioco</Label>
                  <Select
                    value={gameType}
                    onValueChange={(value) => setGameType(value as "books" | "authors" | "years")}
                  >
                    <SelectTrigger id="gameType">
                      <SelectValue placeholder="Seleziona un tipo di gioco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="books">Quiz Libri</SelectItem>
                      <SelectItem value="authors">Quiz Autori</SelectItem>
                      <SelectItem value="years">Quiz Anni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label htmlFor="period">Periodo</Label>
                  <Select
                    value={period}
                    onValueChange={(value) => setPeriod(value as "all_time" | "monthly" | "weekly")}
                  >
                    <SelectTrigger id="period">
                      <SelectValue placeholder="Seleziona un periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_time">Generale</SelectItem>
                      <SelectItem value="monthly">Mensile</SelectItem>
                      <SelectItem value="weekly">Settimanale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 flex-1">
                  <Label htmlFor="searchRewards">Cerca</Label>
                  <Input
                    id="searchRewards"
                    placeholder="Cerca per nome o descrizione"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {isLoadingFeltrinelli ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredFeltrinelliRewards && filteredFeltrinelliRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredFeltrinelliRewards.map((reward) => (
                    <Card key={reward.id} className="overflow-hidden">
                      <div className={`relative h-48 ${getRewardBgColor(reward.rank)} flex flex-col items-center justify-center`}>
                        <div className={`mb-2 p-4 rounded-full ${reward.rank === 1 ? 'bg-yellow-100' : reward.rank === 2 ? 'bg-gray-200' : reward.rank === 3 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                          {getRewardIcon(reward.rank)}
                        </div>
                        <p className="text-lg font-medium">{reward.name}</p>
                        <div className="absolute top-2 right-2 bg-primary text-white py-1 px-3 rounded-full text-xs font-medium">
                          {reward.rank <= 3 ? `${reward.rank}° posto` : `Top ${reward.rank}`}
                        </div>
                      </div>
                      <CardHeader>
                        <div className="flex items-center">
                          {getRewardIcon(reward.rank)}
                          <CardTitle className="ml-2">{reward.name}</CardTitle>
                        </div>
                        <CardDescription>{reward.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Punti richiesti</p>
                            <p className="text-lg font-bold">{reward.points_required}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Gioco</p>
                            <p className="text-sm">{translateGameType(gameType)}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 border-t">
                        <p className="text-sm text-muted-foreground w-full text-center">
                          Classifica {translatePeriod(period)}
                        </p>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <h3 className="text-lg font-medium">Nessun premio trovato</h3>
                  <p className="text-muted-foreground">
                    Non sono stati trovati premi per i criteri selezionati.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Premi Personalizzati</CardTitle>
                <CardDescription>
                  Gestisci i premi personalizzati da assegnare agli utenti in base ai risultati ottenuti.
                </CardDescription>
              </div>
              <Button onClick={handleNewReward}>
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Premio
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <Label htmlFor="searchCustomRewards">Cerca</Label>
                <Input
                  id="searchCustomRewards"
                  placeholder="Cerca per nome o descrizione"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Separator className="my-6" />
              
              {isLoadingCustom ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCustomRewards && filteredCustomRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCustomRewards.map((reward) => (
                    <Card key={reward.id} className="overflow-hidden">
                      <div className={`relative h-48 ${getRewardBgColor(reward.rank)} flex flex-col items-center justify-center`}>
                        {reward.imageUrl ? (
                          <img 
                            src={reward.imageUrl} 
                            alt={reward.name} 
                            className="h-32 w-32 object-contain mb-2"
                          />
                        ) : (
                          <div className={`mb-2 p-4 rounded-full ${reward.rank === 1 ? 'bg-yellow-100' : reward.rank === 2 ? 'bg-gray-200' : reward.rank === 3 ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {getRewardIcon(reward.rank)}
                          </div>
                        )}
                        <p className="text-lg font-medium">{reward.name}</p>
                        <div className="absolute top-2 right-2 bg-primary text-white py-1 px-3 rounded-full text-xs font-medium">
                          {reward.rank <= 3 ? `${reward.rank}° posto` : `Top ${reward.rank}`}
                        </div>
                      </div>
                      <CardHeader>
                        <div className="flex items-center">
                          {getRewardIcon(reward.rank)}
                          <CardTitle className="ml-2">{reward.name}</CardTitle>
                        </div>
                        <CardDescription>{reward.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Tipo</p>
                            <p className="text-lg font-bold">{reward.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">Gioco</p>
                            <p className="text-sm">{translateGameType(reward.gameType)}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-medium">Disponibilità</p>
                          <p className="text-lg font-bold">{reward.available}</p>
                        </div>
                      </CardContent>
                      <CardFooter className="bg-gray-50 border-t flex justify-between">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditReward(reward)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifica
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteReward(reward.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Elimina
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <h3 className="text-lg font-medium">Nessun premio personalizzato</h3>
                  <p className="text-muted-foreground mb-4">
                    Non hai ancora creato premi personalizzati. Clicca il pulsante "Nuovo Premio" per iniziare.
                  </p>
                  <Button onClick={handleNewReward}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo Premio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for creating/editing rewards */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentReward ? "Modifica Premio" : "Nuovo Premio"}</DialogTitle>
            <DialogDescription>
              {currentReward 
                ? "Modifica i dettagli del premio selezionato" 
                : "Inserisci i dettagli per creare un nuovo premio personalizzato"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome del premio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="discount">Sconto</SelectItem>
                            <SelectItem value="gift">Omaggio</SelectItem>
                            <SelectItem value="coupon">Coupon</SelectItem>
                            <SelectItem value="badge">Badge</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrizione</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrizione del premio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valore</FormLabel>
                      <FormControl>
                        <Input placeholder="es. 10€, libro omaggio, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rank"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posizione (Rank)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Posizione in classifica" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disponibilità</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Numero di premi disponibili" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gameType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo di Gioco</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un tipo di gioco" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="books">Quiz Libri</SelectItem>
                            <SelectItem value="authors">Quiz Autori</SelectItem>
                            <SelectItem value="years">Quiz Anni</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icona</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleziona un'icona" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gift">Regalo</SelectItem>
                            <SelectItem value="trophy">Trofeo</SelectItem>
                            <SelectItem value="award">Premio</SelectItem>
                            <SelectItem value="star">Stella</SelectItem>
                            <SelectItem value="heart">Cuore</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colore</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Input 
                            type="color" 
                            className="w-12 h-10 p-1" 
                            {...field} 
                          />
                          <Input 
                            type="text" 
                            className="flex-1 ml-2" 
                            value={field.value} 
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immagine</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {field.value && (
                          <div className="mt-2 flex justify-center">
                            <img 
                              src={field.value} 
                              alt="Anteprima" 
                              className="max-h-32 object-contain" 
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <Input 
                            type="file" 
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="flex-1"
                          />
                          {field.value && (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => form.setValue("imageUrl", null)}
                            >
                              Rimuovi
                            </Button>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {currentReward ? "Aggiorna Premio" : "Crea Premio"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}