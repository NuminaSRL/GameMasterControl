import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function FeltrinelliApiTest() {
  const { toast } = useToast();
  const [apiStatus, setApiStatus] = useState<string>("Sconosciuto");
  const [loading, setLoading] = useState<boolean>(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("health");

  // Function to check API health
  const checkApiHealth = async () => {
    setLoading(true);
    try {
      const response = await apiRequest<{status: string; message: string}>("/api/feltrinelli/health");
      setApiStatus(response.status);
      setApiResponse(response);
      toast({
        title: "Verifica API completata",
        description: `Stato: ${response.status}`,
        variant: response.status === "ok" ? "default" : "destructive",
      });
    } catch (error) {
      setApiStatus("error");
      setApiResponse({ error: "Impossibile connettersi alle API" });
      toast({
        title: "Errore di connessione",
        description: "Impossibile connettersi alle API Feltrinelli",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get book quiz question
  const getBookQuizQuestion = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/api/feltrinelli/bookquiz/question");
      setApiResponse(response);
      toast({
        title: "Domanda quiz libri ricevuta",
        description: "Domanda caricata con successo",
      });
    } catch (error) {
      setApiResponse({ error: "Impossibile ottenere la domanda del quiz" });
      toast({
        title: "Errore",
        description: "Impossibile ottenere la domanda del quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get author quiz question
  const getAuthorQuizQuestion = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/api/feltrinelli/authorquiz/question");
      setApiResponse(response);
      toast({
        title: "Domanda quiz autori ricevuta",
        description: "Domanda caricata con successo",
      });
    } catch (error) {
      setApiResponse({ error: "Impossibile ottenere la domanda del quiz" });
      toast({
        title: "Errore",
        description: "Impossibile ottenere la domanda del quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get year quiz question
  const getYearQuizQuestion = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/api/feltrinelli/yearquiz/question");
      setApiResponse(response);
      toast({
        title: "Domanda quiz anni ricevuta",
        description: "Domanda caricata con successo",
      });
    } catch (error) {
      setApiResponse({ error: "Impossibile ottenere la domanda del quiz" });
      toast({
        title: "Errore",
        description: "Impossibile ottenere la domanda del quiz",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get leaderboard
  const getLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await apiRequest("/api/feltrinelli/leaderboard");
      setApiResponse(response);
      toast({
        title: "Classifica ricevuta",
        description: "Classifica caricata con successo",
      });
    } catch (error) {
      setApiResponse({ error: "Impossibile ottenere la classifica" });
      toast({
        title: "Errore",
        description: "Impossibile ottenere la classifica",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get game leaderboard
  const getGameLeaderboard = async (gameType: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/feltrinelli/leaderboard/${gameType}`);
      setApiResponse(response);
      toast({
        title: "Classifica gioco ricevuta",
        description: `Classifica per ${gameType} caricata con successo`,
      });
    } catch (error) {
      setApiResponse({ error: "Impossibile ottenere la classifica del gioco" });
      toast({
        title: "Errore",
        description: "Impossibile ottenere la classifica del gioco",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to get rewards
  const getRewards = async (gameType: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/feltrinelli/rewards?gameType=${gameType}`);
      setApiResponse(response);
      toast({
        title: "Premi ricevuti",
        description: `Premi per ${gameType} caricati con successo`,
      });
    } catch (error) {
      setApiResponse({ error: "Impossibile ottenere i premi" });
      toast({
        title: "Errore",
        description: "Impossibile ottenere i premi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Test API Feltrinelli</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card>
            <CardHeader>
              <CardTitle>Controlli API</CardTitle>
              <CardDescription>Testa le funzionalità API di Feltrinelli</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="health">Status</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                  <TabsTrigger value="leaderboard">Extra</TabsTrigger>
                </TabsList>
                
                <TabsContent value="health" className="space-y-4">
                  <div>
                    <p className="mb-2">Stato API: <span className={apiStatus === "ok" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{apiStatus}</span></p>
                    <Button onClick={checkApiHealth} disabled={loading}>
                      {loading ? "Verifica in corso..." : "Verifica connessione API"}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="quiz" className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button onClick={getBookQuizQuestion} disabled={loading} variant="outline">
                      Quiz Libri
                    </Button>
                    <Button onClick={getAuthorQuizQuestion} disabled={loading} variant="outline">
                      Quiz Autori
                    </Button>
                    <Button onClick={getYearQuizQuestion} disabled={loading} variant="outline">
                      Quiz Anni
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="leaderboard" className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Button onClick={getLeaderboard} disabled={loading} variant="outline">
                      Classifica Generale
                    </Button>
                    <Button onClick={() => getGameLeaderboard('books')} disabled={loading} variant="outline">
                      Classifica Quiz Libri
                    </Button>
                    <Button onClick={() => getRewards('books')} disabled={loading} variant="outline">
                      Premi Quiz Libri
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Risultato API</CardTitle>
              <CardDescription>Risposta dall'API di Feltrinelli</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[600px]">
                <pre className="whitespace-pre-wrap break-words">
                  {loading ? (
                    "Caricamento in corso..."
                  ) : apiResponse ? (
                    JSON.stringify(apiResponse, null, 2)
                  ) : (
                    "Nessuna risposta da visualizzare. Seleziona un'operazione API."
                  )}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}