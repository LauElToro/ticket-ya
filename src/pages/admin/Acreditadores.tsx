import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  FileDown,
  ClipboardList,
} from 'lucide-react';

const Acreditadores = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [resumenPorteroId, setResumenPorteroId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const { data: eventData } = useQuery({
    queryKey: ['event-stats', eventId],
    queryFn: () => adminApi.getEventStats(eventId!),
    enabled: !!eventId,
  });

  const { data: porterosData, isLoading } = useQuery({
    queryKey: ['event-porteros', eventId],
    queryFn: () => adminApi.getEventPorteros(eventId!),
    enabled: !!eventId,
  });

  const { data: resumenData } = useQuery({
    queryKey: ['portero-resumen', eventId, resumenPorteroId],
    queryFn: () => adminApi.getPorteroResumen(eventId!, resumenPorteroId!),
    enabled: !!eventId && !!resumenPorteroId,
  });

  const event = eventData?.data?.event;
  const porteros = porterosData?.data ?? [];

  const addMutation = useMutation({
    mutationFn: (body: { name: string; email: string; phone?: string }) =>
      adminApi.addPorteroToEvent(eventId!, body),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['event-porteros', eventId] });
      setModalOpen(false);
      setForm({ name: '', email: '', phone: '' });
      const password = res?.data?.password;
      toast({
        title: 'Acreditador agregado',
        description: password
          ? `Contraseña: ${password} (se puede ver también en la tabla y enviar por mail)`
          : 'Asignado al evento.',
      });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'No se pudo agregar',
        variant: 'destructive',
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (porteroId: string) => adminApi.removePorteroFromEvent(eventId!, porteroId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-porteros', eventId] });
      setResumenPorteroId(null);
      toast({ title: 'Acreditador quitado del evento' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email?.trim()) {
      toast({ title: 'Email requerido', variant: 'destructive' });
      return;
    }
    addMutation.mutate({
      name: form.name?.trim() || form.email.split('@')[0],
      email: form.email.trim(),
      phone: form.phone?.trim() || undefined,
    });
  };

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24">Evento no especificado.</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/events/${eventId}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Acreditadores</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              En esta sección podés crear a tus acreditadores y editar los ya creados. El portero escaneará los QR en la puerta.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/portero/scan')}
            className="bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Ir al dashboard de acreditador
          </Button>
          <Button onClick={() => setModalOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Acreditador
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : porteros.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No hay acreditadores para este evento</p>
            <p className="text-sm mt-1">Agregá acreditadores para que puedan escanear entradas en la puerta.</p>
            <Button className="mt-4" onClick={() => setModalOpen(true)}>
              Agregar Acreditador
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Usuario</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Teléfono</th>
                  <th className="text-left py-3 px-4 font-medium">Contraseña</th>
                  <th className="text-left py-3 px-4 font-medium">Acreditaciones</th>
                  <th className="text-right py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {porteros.map((p: any) => (
                  <tr key={p.id} className="border-t">
                    <td className="py-3 px-4">{p.nombre ?? '-'}</td>
                    <td className="py-3 px-4">{p.usuario ?? p.email ?? '-'}</td>
                    <td className="py-3 px-4">{p.email ?? '-'}</td>
                    <td className="py-3 px-4">{p.telefono ?? '-'}</td>
                    <td className="py-3 px-4 font-mono text-sm">
                      {p.initialPassword ? (
                        <span className="bg-muted px-2 py-1 rounded">{p.initialPassword}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="link"
                        size="sm"
                        className="text-green-600 h-auto p-0"
                        onClick={() => setResumenPorteroId(p.id)}
                      >
                        Resumen ({p.acreditacionesCount ?? 0})
                      </Button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => removeMutation.mutate(p.id)}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Crear Acreditador!</DialogTitle>
            <DialogDescription>
              Se generará una contraseña que podés ver en la tabla y enviar por mail al acreditador. Debe ingresar con su email y esa contraseña en el dashboard de acreditador, y luego el código y llave del evento para escanear QR.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Escribe el nombre completo aquí"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Escribe el email aquí"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Escribe el teléfono aquí"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              AGREGAR ACREDITADOR
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resumenPorteroId} onOpenChange={(open) => !open && setResumenPorteroId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Resumen — QR escaneados</DialogTitle>
            <DialogDescription>Historial de entradas validadas por este acreditador en el evento.</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            {resumenData?.data?.length ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Fecha/hora</th>
                    <th className="text-left py-2">Propietario</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Válida</th>
                  </tr>
                </thead>
                <tbody>
                  {resumenData.data.map((v: any) => (
                    <tr key={v.id} className="border-b">
                      <td className="py-2">{new Date(v.scannedAt).toLocaleString('es-AR')}</td>
                      <td className="py-2">{v.ticketOwner ?? '-'}</td>
                      <td className="py-2">{v.ticketEmail ?? '-'}</td>
                      <td className="py-2">{v.isValid ? 'Sí' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-muted-foreground text-sm py-4">Aún no hay escaneos.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Acreditadores;
