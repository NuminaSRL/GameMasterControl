import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
}

export default function BadgesPage() {
  const [newBadge, setNewBadge] = useState({
    name: "",
    description: "",
    icon: "",
    color: "#4f46e5" // Default color
  });
  const { toast } = useToast();

  // Fetch badges
  const { data: badges = [], isLoading, refetch } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    refetchOnWindowFocus: false,
  });

  // Create badge mutation
  const createBadgeMutation = useMutation({
    mutationFn: async (badgeData: Omit<Badge, "id" | "created_at">) => {
      return apiRequest("/api/badges", "POST", badgeData);
    },
    onSuccess: () => {
      toast({
        title: "Badge creato",
        description: "Il badge è stato creato con successo",
      });
      // Reset form
      setNewBadge({
        name: "",
        description: "",
        icon: "",
        color: "#4f46e5"
      });
      // Refetch badges
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Errore durante la creazione del badge: ${error instanceof Error ? error.message : "Errore sconosciuto"}`,
        variant: "destructive",
      });
    },
  });

  const handleCreateBadge = () => {
    if (!newBadge.name || !newBadge.description || !newBadge.icon) {
      toast({
        title: "Errore",
        description: "Tutti i campi sono obbligatori",
        variant: "destructive",
      });
      return;
    }
    createBadgeMutation.mutate(newBadge);
  };

  const presetIcons = [
    "trophy", "medal", "star", "award", "certificate", 
    "crown", "diamond", "gift", "heart", "thumbs-up"
  ];

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestione Badge</h1>
          <p className="text-muted-foreground">
            Gestisci i badge assegnabili ai giochi
          </p>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <PlusIcon className="mr-2 h-4 w-4" /> Nuovo Badge
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Crea un nuovo badge</SheetTitle>
              <SheetDescription>
                Compila il form per creare un nuovo badge che potrà essere assegnato agli utenti che completano sfide nei giochi.
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  placeholder="Es. Quiz Master" 
                  value={newBadge.name}
                  onChange={(e) => setNewBadge({...newBadge, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrizione</Label>
                <Input 
                  id="description" 
                  placeholder="Es. Completato 10 quiz con punteggio perfetto" 
                  value={newBadge.description}
                  onChange={(e) => setNewBadge({...newBadge, description: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon">Icona</Label>
                <Input 
                  id="icon" 
                  placeholder="Es. trophy" 
                  value={newBadge.icon}
                  onChange={(e) => setNewBadge({...newBadge, icon: e.target.value})}
                />
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {presetIcons.map(icon => (
                    <Button
                      key={icon}
                      variant="outline"
                      className="h-10 p-0"
                      onClick={() => setNewBadge({...newBadge, icon})}
                    >
                      <span className="text-xs">{icon}</span>
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Suggerimento: Usa i nomi delle icone da Lucide React
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="color">Colore</Label>
                <div className="flex space-x-2">
                  <Input 
                    id="color" 
                    type="color"
                    className="w-12"
                    value={newBadge.color}
                    onChange={(e) => setNewBadge({...newBadge, color: e.target.value})}
                  />
                  <Input 
                    type="text"
                    placeholder="#4f46e5" 
                    value={newBadge.color}
                    onChange={(e) => setNewBadge({...newBadge, color: e.target.value})}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleCreateBadge}
                disabled={createBadgeMutation.isPending}
              >
                {createBadgeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crea Badge
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <Separator className="my-6" />
      
      {isLoading ? (
        <div className="flex justify-center my-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : badges && badges.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge: Badge) => (
            <Card key={badge.id}>
              <CardHeader style={{ borderBottom: `2px solid ${badge.color}` }}>
                <div className="flex justify-between items-center">
                  <CardTitle>{badge.name}</CardTitle>
                  <div 
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: badge.color }}
                  >
                    <span className="text-white text-lg">{badge.icon.charAt(0).toUpperCase()}</span>
                  </div>
                </div>
                <CardDescription>{badge.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Icona: {badge.icon}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <p className="text-xs text-muted-foreground">
                  Creato il {new Date(badge.created_at).toLocaleDateString()}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg">
          <h3 className="text-lg font-medium">Nessun badge creato</h3>
          <p className="text-muted-foreground mb-4">
            Non hai ancora creato badge da assegnare agli utenti.
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" /> Crea il tuo primo badge
              </Button>
            </SheetTrigger>
            <SheetContent>
              {/* Contenuto dello sheet identico a quello sopra */}
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}