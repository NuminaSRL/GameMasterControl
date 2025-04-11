import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Reward } from "@/shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
}

export default function EditRewardModal({ isOpen, onClose, reward }: EditRewardModalProps) {
  const { toast } = useToast();
  const isNewReward = !reward;
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    points: 0,
    isActive: true,
    type: 'merchandise', // Default type
    value: '', // Value field for the type
    startDate: null as string | null,
    endDate: null as string | null,
    rank: 0,
    icon: '',
    color: '#000000'
  });
  
  // Reset form when reward changes
  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description,
        imageUrl: reward.imageUrl,
        points: reward.points,
        isActive: reward.isActive,
        type: reward.type || 'merchandise',
        value: reward.value || '',
        startDate: reward.startDate || null,
        endDate: reward.endDate || null,
        rank: reward.rank || 0,
        icon: reward.icon || '',
        color: reward.color || '#000000'
      });
    } else {
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        points: 0,
        isActive: true,
        type: 'merchandise',
        value: '',
        startDate: null,
        endDate: null,
        rank: 0,
        icon: '',
        color: '#000000'
      });
    }
  }, [reward]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value
    }));
  };

  // Funzione per gestire i cambiamenti nei componenti Select
  const handleSelectChange = (value: string, field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isActive: checked
    }));
  };

  // Aggiungi questa funzione per gestire l'upload delle immagini
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    
    try {
      // Mostra un toast di caricamento
      toast({
        title: "Caricamento in corso",
        description: "Stiamo caricando la tua immagine...",
      });
      
      // Invia il file al server
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });
      
      if (!response.ok) throw new Error('Errore durante il caricamento');
      
      const data = await response.json();
      
      // Aggiorna il formData con l'URL dell'immagine caricata
      setFormData(prev => ({
        ...prev,
        imageUrl: data.imageUrl
      }));
      
      toast({
        title: "Immagine caricata",
        description: "L'immagine è stata caricata con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: `Non è stato possibile caricare l'immagine: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    }
  };

  // Save reward mutation
  const saveRewardMutation = useMutation({
    mutationFn: async () => {
      if (isNewReward) {
        return await apiRequest('POST', '/api/feltrinelli/rewards', formData);
      } else {
        return await apiRequest('PUT', `/api/feltrinelli/rewards/${reward.id}`, formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feltrinelli/rewards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      
      toast({
        title: isNewReward ? "Premio Creato" : "Premio Aggiornato",
        description: isNewReward 
          ? "Il nuovo premio è stato creato con successo." 
          : "Il premio è stato aggiornato con successo.",
      });
      
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: `Non è stato possibile ${isNewReward ? 'creare' : 'aggiornare'} il premio: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRewardMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isNewReward ? 'Crea Nuovo Premio' : 'Modifica Premio'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name" className="font-medium">Nome Premio</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="font-medium">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
                rows={3}
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="imageUpload" className="font-medium">Immagine</Label>
              <div className="grid grid-cols-1 gap-3">
                {formData.imageUrl && (
                  <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={formData.imageUrl} 
                      alt="Anteprima premio" 
                      className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 rounded-full w-8 h-8 p-0 flex items-center justify-center"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 border-gray-300 focus:border-blue-500"
                  />
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 border-gray-300 hover:bg-gray-50"
                      onClick={() => document.getElementById('imageUpload')?.click()}
                    >
                      <i className="fas fa-upload mr-2"></i> Carica
                    </Button>
                    <Input
                      id="imageUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Inserisci l'URL di un'immagine esistente o carica una nuova immagine. Le immagini dovrebbero essere in formato quadrato (1:1) per una visualizzazione ottimale.
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="points" className="font-medium">Punti Richiesti</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min="0"
                value={formData.points}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type" className="font-medium">Tipo Premio</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleSelectChange(value, 'type')}
              >
                <SelectTrigger className="border-gray-300 bg-white">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  <SelectItem value="merchandise">Merchandise</SelectItem>
                  <SelectItem value="discount">Sconto</SelectItem>
                  <SelectItem value="gift_card">Gift Card</SelectItem>
                  <SelectItem value="experience">Esperienza</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value" className="font-medium">Valore</Label>
              <Input
                id="value"
                name="value"
                value={formData.value}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
                placeholder={formData.type === 'discount' ? 'es. 10%' : 'es. Segnalibro'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="isActive" className="font-medium">Stato Premio</Label>
              <div className="h-10 flex items-center px-3 py-2 border border-gray-300 rounded-md bg-white">
                <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  formData.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {formData.isActive ? 'Attivo' : 'Inattivo'}
                </div>
                <div className="ml-auto">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleSwitchChange}
                    className={`${
                      formData.isActive ? 'bg-green-500' : 'bg-red-500'
                    } data-[state=unchecked]:bg-gray-200 data-[state=unchecked]:border-gray-300`}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rank" className="font-medium">Posizione</Label>
              <Input
                id="rank"
                name="rank"
                type="number"
                min="0"
                value={formData.rank}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate" className="font-medium">Data Inizio</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate || ''}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="font-medium">Data Fine</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate || ''}
                onChange={handleChange}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon" className="font-medium">Icona</Label>
              <Input
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                placeholder="es. fa-gift"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color" className="font-medium">Colore</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-12 h-10 p-1 border-gray-300"
                />
                <Input
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="flex-1 border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Annulla
            </Button>
            <Button 
              type="submit" 
              disabled={saveRewardMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saveRewardMutation.isPending ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  Salvataggio...
                </>
              ) : (
                'Salva Premio'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}