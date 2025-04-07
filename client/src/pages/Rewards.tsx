import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trophy, Award, Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Reward {
  id: string;
  name: string;
  description: string;
  image_url: string;
  points_required: number;
  rank: number;
}

export default function RewardsPage() {
  const [gameType, setGameType] = useState<"books" | "authors" | "years">("books");
  const [period, setPeriod] = useState<"all_time" | "monthly" | "weekly">("all_time");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rewards from Feltrinelli API
  const { data: rewards = [], isLoading } = useQuery<Reward[]>({
    queryKey: [`/api/feltrinelli/rewards?gameType=${gameType}&period=${period}`],
    refetchOnWindowFocus: false,
  });

  // Filter rewards based on search query
  const filteredRewards = rewards.filter(
    (reward: Reward) =>
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          Visualizza i premi disponibili per le classifiche dei giochi
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
              
              {isLoading ? (
                <div className="flex justify-center my-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRewards && filteredRewards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRewards.map((reward: Reward) => (
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
            <CardHeader>
              <CardTitle>Premi Personalizzati</CardTitle>
              <CardDescription>
                Puoi creare premi personalizzati da assegnare agli utenti in base ai risultati ottenuti.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">Funzionalità in arrivo</h3>
                <p className="text-muted-foreground mb-4">
                  La gestione dei premi personalizzati sarà disponibile prossimamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}