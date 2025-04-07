import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label"; 
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface FeltrinelliGame {
  id: string;
  feltrinelliId: string;
  internalId: number | null;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface InternalGame {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  gameType: string;
}

interface FeltrinelliUserProfile {
  id: string;
  userId: string;
  internalUserId: number | null;
  username: string;
  email: string | null;
  avatarUrl: string | null;
}

export default function FeltrinelliMapping() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("games");
  const [gameIdToLink, setGameIdToLink] = useState<number | null>(null);
  const [feltrinelliGameIdToLink, setFeltrinelliGameIdToLink] = useState("");

  // Queries per ottenere i dati
  const { data: feltrinelliGames, isLoading: isLoadingFeltrinelliGames } = 
    useQuery<FeltrinelliGame[]>({
      queryKey: ['/api/feltrinelli-mapping/games'],
    });

  const { data: internalGames, isLoading: isLoadingInternalGames } = 
    useQuery<InternalGame[]>({
      queryKey: ['/api/games'],
    });

  const { data: userProfiles, isLoading: isLoadingUserProfiles } = 
    useQuery<FeltrinelliUserProfile[]>({
      queryKey: ['/api/feltrinelli-mapping/user-profiles'],
    });

  // Mutations per collegare/scollegare i giochi
  const linkGameMutation = useMutation({
    mutationFn: (data: { feltrinelliId: string, internalId: number }) => 
      apiRequest<any>('/api/feltrinelli-mapping/games/link', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Gioco collegato con successo",
        description: "La mappatura è stata aggiornata",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli-mapping/games'] });
      setGameIdToLink(null);
      setFeltrinelliGameIdToLink("");
    },
    onError: (error) => {
      toast({
        title: "Errore nel collegamento",
        description: `Si è verificato un errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    }
  });

  const unlinkGameMutation = useMutation({
    mutationFn: (feltrinelliId: string) => 
      apiRequest<any>('/api/feltrinelli-mapping/games/unlink', 'POST', { feltrinelliId }),
    onSuccess: () => {
      toast({
        title: "Collegamento rimosso",
        description: "La mappatura è stata aggiornata",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli-mapping/games'] });
    },
    onError: (error) => {
      toast({
        title: "Errore nella rimozione",
        description: `Si è verificato un errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    }
  });

  // Funzione per collegare un gioco
  const handleLinkGame = () => {
    if (!feltrinelliGameIdToLink || !gameIdToLink) {
      toast({
        title: "Dati incompleti",
        description: "Seleziona un ID Feltrinelli e un ID interno",
        variant: "destructive",
      });
      return;
    }

    linkGameMutation.mutate({
      feltrinelliId: feltrinelliGameIdToLink,
      internalId: gameIdToLink
    });
  };

  // Funzione per scollegare un gioco
  const handleUnlinkGame = (feltrinelliId: string) => {
    unlinkGameMutation.mutate(feltrinelliId);
  };

  const isGameLinked = (game: FeltrinelliGame) => {
    return game.internalId !== null;
  };

  const getInternalGameName = (internalId: number | null) => {
    if (!internalId || !internalGames) return 'Non collegato';
    const game = internalGames.find(game => game.id === internalId);
    return game ? game.name : 'Gioco non trovato';
  };

  const getAvailableFeltrinelliGameIds = () => {
    if (!feltrinelliGames) return [];
    return feltrinelliGames
      .filter(game => game.internalId === null)
      .map(game => game.feltrinelliId);
  };

  const getAvailableInternalGameIds = () => {
    if (!internalGames || !feltrinelliGames) return [];
    const linkedInternalIds = feltrinelliGames
      .filter(fg => fg.internalId !== null)
      .map(fg => fg.internalId);
    
    return internalGames
      .filter(game => !linkedInternalIds.includes(game.id))
      .map(game => game.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Collegamento Feltrinelli</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-1/3 grid-cols-2">
          <TabsTrigger value="games">Giochi</TabsTrigger>
          <TabsTrigger value="users">Utenti</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mappatura Giochi Feltrinelli</CardTitle>
              <CardDescription>
                Collega i giochi di Feltrinelli con i giochi interni
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
                  <div className="w-full md:w-1/3">
                    <Label htmlFor="feltrinelliGameId">ID Gioco Feltrinelli</Label>
                    <select
                      id="feltrinelliGameId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={feltrinelliGameIdToLink}
                      onChange={(e) => setFeltrinelliGameIdToLink(e.target.value)}
                    >
                      <option value="">Seleziona ID Feltrinelli</option>
                      {getAvailableFeltrinelliGameIds().map(id => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-1/3">
                    <Label htmlFor="internalGameId">ID Gioco Interno</Label>
                    <select
                      id="internalGameId"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={gameIdToLink || ""}
                      onChange={(e) => setGameIdToLink(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">Seleziona ID interno</option>
                      {getAvailableInternalGameIds().map(id => (
                        <option key={id} value={id}>
                          {id} - {internalGames?.find(game => game.id === id)?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button 
                    onClick={handleLinkGame} 
                    disabled={!feltrinelliGameIdToLink || !gameIdToLink || linkGameMutation.isPending}
                  >
                    Collega Giochi
                  </Button>
                </div>

                {isLoadingFeltrinelliGames || isLoadingInternalGames ? (
                  <div>Caricamento...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Feltrinelli</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead>ID Interno</TableHead>
                        <TableHead>Nome Interno</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feltrinelliGames && feltrinelliGames.map((game) => (
                        <TableRow key={game.id}>
                          <TableCell>{game.feltrinelliId}</TableCell>
                          <TableCell>{game.name}</TableCell>
                          <TableCell>
                            {game.isActive ? (
                              <Badge variant="default" className="bg-green-500">Attivo</Badge>
                            ) : (
                              <Badge variant="outline">Inattivo</Badge>
                            )}
                          </TableCell>
                          <TableCell>{game.internalId || '-'}</TableCell>
                          <TableCell>{getInternalGameName(game.internalId)}</TableCell>
                          <TableCell className="text-right">
                            {isGameLinked(game) ? (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleUnlinkGame(game.feltrinelliId)}
                                disabled={unlinkGameMutation.isPending}
                              >
                                Scollega
                              </Button>
                            ) : (
                              <Badge variant="outline">Non collegato</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profili Utenti Feltrinelli</CardTitle>
              <CardDescription>
                Visualizza i profili utente importati da Feltrinelli
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUserProfiles ? (
                <div>Caricamento profili...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID Utente Feltrinelli</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>ID Utente Interno</TableHead>
                      <TableHead>Stato</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userProfiles && userProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-mono text-xs">{profile.userId}</TableCell>
                        <TableCell>{profile.username}</TableCell>
                        <TableCell>{profile.email || '-'}</TableCell>
                        <TableCell>{profile.internalUserId || '-'}</TableCell>
                        <TableCell>
                          {profile.internalUserId ? (
                            <Badge variant="default" className="bg-green-500">Collegato</Badge>
                          ) : (
                            <Badge variant="outline">Non collegato</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}