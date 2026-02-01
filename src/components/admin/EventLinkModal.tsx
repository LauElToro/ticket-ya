import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EventLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventLink: string;
}

export function EventLinkModal({ open, onOpenChange, eventLink }: EventLinkModalProps) {
  const copy = () => {
    if (eventLink) {
      navigator.clipboard.writeText(eventLink);
      toast({ title: 'Link copiado al portapapeles' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-600" />
            Link del evento
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-2">
          Esta es la URL pública para vender entradas. Compartila en redes o campañas.
        </p>
        <div className="flex gap-2">
          <Input
            value={eventLink}
            readOnly
            className="font-mono text-sm"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <Button onClick={copy}>Copiar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
