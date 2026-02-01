import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api';
import { Gift, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface GiftModalProps {
  eventId: string;
  onClose: () => void;
}

export function GiftModal({ eventId, onClose }: GiftModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ticketTypeId: '',
    quantity: '1',
    recipientEmail: '',
    recipientName: '',
    message: '',
  });

  const { data: eventData } = useQuery({
    queryKey: ['event-stats', eventId],
    queryFn: () => adminApi.getEventStats(eventId),
    enabled: !!eventId,
  });

  const giftMutation = useMutation({
    mutationFn: (data: any) => adminApi.giftTicketsByEmail({ eventId, ...data }),
    onSuccess: (response) => {
      toast({
        title: 'Entradas regaladas',
        description: response.data?.message || 'Se enviaron las entradas correctamente',
      });
      queryClient.invalidateQueries({ queryKey: ['event-stats', eventId] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron regalar las entradas',
        variant: 'destructive',
      });
    },
  });

  const event = eventData?.data?.event;
  const ticketTypes = event?.ticketTypes || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticketTypeId || !formData.recipientEmail) {
      toast({ title: 'Completa los campos requeridos', variant: 'destructive' });
      return;
    }
    giftMutation.mutate({
      ticketTypeId: formData.ticketTypeId,
      quantity: parseInt(formData.quantity),
      recipientEmail: formData.recipientEmail,
      recipientName: formData.recipientName || undefined,
      message: formData.message || undefined,
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Enviar cortesías
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Tipo de entrada *</Label>
            <select
              value={formData.ticketTypeId}
              onChange={(e) => setFormData({ ...formData, ticketTypeId: e.target.value })}
              className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 py-2"
              required
            >
              <option value="">Seleccionar</option>
              {ticketTypes.map((tt: any) => (
                <option key={tt.id} value={tt.id}>
                  {tt.name} (Disponibles: {tt.availableQty})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Cantidad *</Label>
            <Input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>
          <div>
            <Label>Email del destinatario *</Label>
            <Input
              type="email"
              value={formData.recipientEmail}
              onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Nombre (opcional)</Label>
            <Input
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            />
          </div>
          <div>
            <Label>Mensaje (opcional)</Label>
            <Textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={giftMutation.isPending}>
              {giftMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Enviar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
