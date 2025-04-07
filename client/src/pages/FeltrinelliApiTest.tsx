import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from '@/lib/queryClient';

// Tipo per il risultato dell'health check
type HealthCheckResult = {
  status: string;
  message: string;
};

// Tipo per una domanda del quiz sui libri
type BookQuizQuestion = {
  question_id: string;
  question_text: string;
  abstract_snippet: string;
  options: {
    id: string;
    title: string;
    author: string;
    image_url: string;
  }[];
};

// Tipo per la risposta del quiz
type AnswerResult = {
  is_correct: boolean;
  message: string;
  points: number;
  correct_book?: {
    id: string;
    title: string;
    authors: string;
    abstract: string;
    image_url: string;
  };
};

export default function FeltrinelliApiTest() {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookQuestion, setBookQuestion] = useState<BookQuizQuestion | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Esegue l'health check
  const runHealthCheck = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<HealthCheckResult>('/api/health', 'GET');
      setHealthCheck(result);
    } catch (err) {
      setError(`Errore durante l'health check: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Crea una nuova sessione di gioco
  const createGameSession = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Utilizziamo un UUID valido come richiesto dall'API Feltrinelli
      const result = await apiRequest(
        '/api/games/session', 
        'POST', 
        {
          user_id: '00000000-0000-0000-0000-000000000099', // UUID formato valido per test
          game_id: '00000000-0000-0000-0000-000000000001' // Quiz libri
        }
      );
      setSessionId(result.session_id);
    } catch (err) {
      setError(`Errore durante la creazione della sessione: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Ottiene una domanda del quiz sui libri
  const getBookQuestion = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<BookQuizQuestion>('/api/games/bookquiz/question?difficulty=1', 'GET');
      setBookQuestion(result);
    } catch (err) {
      setError(`Errore nell'ottenere la domanda: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Invia una risposta al quiz
  const submitAnswer = async (optionId: string) => {
    if (!sessionId || !bookQuestion) {
      setError('Sessione o domanda non disponibile');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await apiRequest<AnswerResult>(
        '/api/games/bookquiz/answer',
        'POST',
        {
          session_id: sessionId,
          question_id: bookQuestion.question_id,
          answer_option_id: optionId,
          time_taken: 5.0
        }
      );
      setAnswerResult(result);
    } catch (err) {
      setError(`Errore nell'invio della risposta: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Resetta tutto
  const resetAll = () => {
    setHealthCheck(null);
    setBookQuestion(null);
    setAnswerResult(null);
    setSessionId(null);
    setError(null);
  };

  // Esegue l'health check al caricamento della pagina
  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Test API Feltrinelli</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Health Check */}
        <Card>
          <CardHeader>
            <CardTitle>Health Check</CardTitle>
            <CardDescription>Verifica lo stato dell'API</CardDescription>
          </CardHeader>
          <CardContent>
            {healthCheck ? (
              <div className="p-4 bg-muted rounded-md">
                <p><strong>Stato:</strong> {healthCheck.status}</p>
                <p><strong>Messaggio:</strong> {healthCheck.message}</p>
              </div>
            ) : (
              <p>Nessun health check eseguito</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={runHealthCheck} disabled={isLoading}>
              {isLoading ? 'Verifica in corso...' : 'Verifica stato API'}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Sessione di gioco */}
        <Card>
          <CardHeader>
            <CardTitle>Sessione di gioco</CardTitle>
            <CardDescription>Crea una nuova sessione per il quiz</CardDescription>
          </CardHeader>
          <CardContent>
            {sessionId ? (
              <div className="p-4 bg-muted rounded-md">
                <p><strong>ID Sessione:</strong> {sessionId}</p>
              </div>
            ) : (
              <p>Nessuna sessione attiva</p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={createGameSession} disabled={isLoading}>
              {isLoading ? 'Creazione in corso...' : 'Crea sessione'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Separator className="my-8" />
      
      {/* Quiz sui libri */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quiz sui libri</CardTitle>
          <CardDescription>Test dell'API per il quiz sui libri</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {bookQuestion && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h3 className="font-semibold text-lg">{bookQuestion.question_text}</h3>
                  <p className="italic mt-2">{bookQuestion.abstract_snippet}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {bookQuestion.options.map((option) => (
                    <div 
                      key={option.id}
                      className="border rounded-md p-4 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => submitAnswer(option.id)}
                    >
                      <h4 className="font-medium">{option.title}</h4>
                      <p className="text-muted-foreground text-sm">{option.author}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!bookQuestion && (
              <p>Nessuna domanda caricata. Crea prima una sessione e poi ottieni una domanda.</p>
            )}
            
            {answerResult && (
              <div className={`p-4 rounded-md ${answerResult.is_correct ? 'bg-green-100' : 'bg-red-100'}`}>
                <h3 className="font-semibold">
                  {answerResult.is_correct ? '✅ Risposta corretta!' : '❌ Risposta errata'}
                </h3>
                <p>{answerResult.message}</p>
                <Badge variant={answerResult.is_correct ? "default" : "outline"} className="mt-2">
                  Punti: {answerResult.points}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <Button onClick={getBookQuestion} disabled={isLoading || !sessionId}>
            {isLoading ? 'Caricamento...' : 'Ottieni domanda'}
          </Button>
          
          <Button variant="outline" onClick={resetAll}>
            Resetta tutto
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}