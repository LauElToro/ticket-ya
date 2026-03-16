import { useState, useRef } from 'react';
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
  Link2,
  Copy,
  UserX,
  UserCheck,
  Download,
  Upload,
  Search,
  XCircle,
} from 'lucide-react';

const LinksRRPP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterName, setFilterName] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', commissionPercent: '', cvuCbu: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['event-promotores', id],
    queryFn: () => adminApi.getEventPromotores(id!),
    enabled: !!id,
  });

  const addMutation = useMutation({
    mutationFn: (body: { name: string; email: string; phone?: string; commissionPercent?: number; cvuCbu?: string | null }) =>
      adminApi.addPromotorToEvent(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-promotores', id] });
      setModalOpen(false);
      setForm({ name: '', email: '', phone: '', commissionPercent: '', cvuCbu: '' });
      toast({ title: 'Promotor agregado', description: 'Se enviará el link por email cuando lo actives.' });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'No se pudo agregar',
        variant: 'destructive',
      });
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ vendedorId, isActive }: { vendedorId: string; isActive: boolean }) =>
      adminApi.setPromotorActive(id!, vendedorId, isActive),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['event-promotores', id] });
      toast({
        title: isActive ? 'Promotor activado' : 'Promotor desactivado',
        description: isActive ? 'Se enviará el link por email al promotor.' : '',
      });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Error', variant: 'destructive' });
    },
  });

  const activateAllMutation = useMutation({
    mutationFn: () => adminApi.activateAllPromotores(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-promotores', id] });
      toast({ title: 'Todos activados', description: 'Se enviarán los links por email.' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message, variant: 'destructive' }),
  });

  const deactivateAllMutation = useMutation({
    mutationFn: () => adminApi.deactivateAllPromotores(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-promotores', id] });
      toast({ title: 'Todos desactivados' });
    },
    onError: (e: any) => toast({ title: 'Error', description: e?.response?.data?.message, variant: 'destructive' }),
  });

  const importMutation = useMutation({
    mutationFn: (items: Array<{ name: string; email: string; phone?: string }>) =>
      adminApi.importEventPromotores(id!, items),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['event-promotores', id] });
      const ok = res?.data?.results?.filter((r: any) => r.success).length ?? 0;
      toast({ title: 'Importación lista', description: `${ok} promotores agregados.` });
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (e: any) => toast({ title: 'Error al importar', description: e?.message, variant: 'destructive' }),
  });

  const event = data?.data?.event;
  const promotores = data?.data?.promotores || [];
  const filtered = filterName.trim()
    ? promotores.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(filterName.toLowerCase()) ||
          p.email?.toLowerCase().includes(filterName.toLowerCase())
      )
    : promotores;

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
      commissionPercent: form.commissionPercent ? Number(form.commissionPercent) : undefined,
      cvuCbu: form.cvuCbu?.trim() || undefined,
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copiado', description: 'Podés pegarlo y enviarlo por mail o mensaje.' });
  };

  const handleExport = async () => {
    try {
      await adminApi.exportEventPromotoresExcel(id!);
      toast({ title: 'Excel descargado' });
    } catch (e) {
      toast({ title: 'Error al descargar', variant: 'destructive' });
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      const header = lines[0]?.toLowerCase() || '';
      const hasHeader = header.includes('email') || header.includes('nombre');
      const start = hasHeader ? 1 : 0;
      const items: Array<{ name: string; email: string; phone?: string }> = [];
      for (let i = start; i < lines.length; i++) {
        const parts = lines[i].split(/[,\t;]/).map((p) => p.trim());
        const email = parts[1] || parts[0];
        const name = parts[0] && parts[0].includes('@') ? parts[0].split('@')[0] : (parts[0] || email?.split('@')[0]);
        if (email?.includes('@')) items.push({ name: name || email, email, phone: parts[2] });
      }
      if (items.length) importMutation.mutate(items);
      else toast({ title: 'No se encontraron filas con email', variant: 'destructive' });
    };
    reader.readAsText(file, 'UTF-8');
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-48">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  const eventTitle = event.title || 'Evento';
  const eventDate = event.date
    ? new Date(event.date).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 pt-24 pb-16">
        <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Mis eventos
        </Button>

        <div className="mb-4">
          <h1 className="text-xl font-semibold text-muted-foreground">
            Evento: {event.authorizationCode || id?.slice(-6)} - {eventTitle.toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">{eventDate}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <Button onClick={() => setModalOpen(true)} className="bg-amber-500 hover:bg-amber-600">
            <Plus className="w-4 h-4 mr-2" />
            Agregar promotor
          </Button>
          <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/stats`)}>
            Resultados RRPP
          </Button>
          <Button
            variant="outline"
            onClick={() => deactivateAllMutation.mutate()}
            disabled={deactivateAllMutation.isPending || promotores.length === 0}
          >
            Desactivar Todos
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600"
            onClick={() => activateAllMutation.mutate()}
            disabled={activateAllMutation.isPending || promotores.length === 0}
          >
            Activar Todos
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={promotores.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Descargar Excel
          </Button>
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.txt"
              className="hidden"
              onChange={handleFileImport}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              Cargar Excel / CSV
            </Button>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <Label className="sr-only">Filtrar por Nombre</Label>
          <Input
            placeholder="Filtrar por Nombre..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="secondary">Filtrar</Button>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Nombre</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Link Venta</th>
                <th className="text-left py-3 px-4 font-medium">Link Invitación</th>
                <th className="text-left py-3 px-4 font-medium">Cortesía</th>
                <th className="text-left py-3 px-4 font-medium">Vendidas</th>
                <th className="text-left py-3 px-4 font-medium">Invitaciones</th>
                <th className="text-left py-3 px-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">
                    No hay promotores. Agregá uno con el botón &quot;Agregar promotor&quot; o cargá un Excel.
                  </td>
                </tr>
              ) : (
                filtered.map((p: any) => (
                  <tr key={p.vendedorId} className="border-t">
                    <td className="py-3 px-4">{p.name}</td>
                    <td className="py-3 px-4">{p.email}</td>
                    <td className="py-3 px-4">
                      {p.linkVenta?.customUrl ? (
                        <button
                          type="button"
                          onClick={() => handleCopyLink(p.linkVenta.customUrl)}
                          className="text-amber-600 hover:underline flex items-center gap-1"
                          title="Copiar link de venta"
                        >
                          <Link2 className="w-4 h-4" />
                          Copiar
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">-</td>
                    <td className="py-3 px-4">{p.cortesia ?? '0/0'}</td>
                    <td className="py-3 px-4">{p.soldQty ?? 0}</td>
                    <td className="py-3 px-4">{p.invitaciones ?? '0'}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMutation.mutate({
                            vendedorId: p.vendedorId,
                            isActive: !p.isActive,
                          })
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                          p.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                        title={p.isActive ? 'Desactivar' : 'Activar (envía link por email)'}
                      >
                        {p.isActive ? (
                          <UserCheck className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        {p.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Crear Promotor!</DialogTitle>
            <DialogDescription>
              El link de referido se enviará al email del promotor cuando lo actives. Podés copiarlo y enviárselo también desde esta pantalla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nombre completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Escribe el nombre completo aqui"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Escribe el email aqui"
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
            <div>
              <Label>% comisión RRPP (opcional)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={form.commissionPercent}
                onChange={(e) => setForm((f) => ({ ...f, commissionPercent: e.target.value }))}
                placeholder="Ej: 10"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Porcentaje que se lleva el promotor por cada venta.</p>
            </div>
            <div>
              <Label>CVU/CBU (opcional)</Label>
              <Input
                value={form.cvuCbu}
                onChange={(e) => setForm((f) => ({ ...f, cvuCbu: e.target.value }))}
                placeholder="Para liquidación"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={addMutation.isPending}>
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              AGREGAR PROMOTOR
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default LinksRRPP;
