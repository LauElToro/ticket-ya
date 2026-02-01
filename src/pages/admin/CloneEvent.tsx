import { useParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CopyPlus, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const CloneEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const cloneMutation = useMutation({
    mutationFn: () => adminApi.cloneEvent(id!),
    onSuccess: (res) => {
      toast({ title: 'Evento clonado', description: 'Se creó una copia del evento. Será redirigido al nuevo evento.' });
      navigate(`/admin/events/${res.data.id}`);
    },
    onError: (err: any) => {
      toast({ title: 'Error al clonar', description: err.message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-24 max-w-xl">
        <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al evento
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CopyPlus className="w-6 h-6 text-emerald-600" />
              Clonar Evento
            </CardTitle>
            <CardDescription>
              Se creará una copia exacta del evento con la misma configuración, tipos de entrada, precios y tandas.
              Las ventas y entradas emitidas no se copian. La fecha del nuevo evento se ajustará al día siguiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              onClick={() => cloneMutation.mutate()}
              disabled={cloneMutation.isPending}
            >
              {cloneMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CopyPlus className="w-4 h-4 mr-2" />
              )}
              Clonar evento
            </Button>
            <Button variant="outline" onClick={() => navigate(`/admin/events/${id}`)}>
              Cancelar
            </Button>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default CloneEvent;
