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
  Download,
  Trash2,
  Pencil,
  FileSpreadsheet,
  Send,
  Mail,
} from 'lucide-react';

/** Parsea CSV o texto con columnas nombre / email (separador coma, punto y coma o tab) */
function parseNameEmailFile(text: string): { name: string; email: string }[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const sep = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const header = lines[0].toLowerCase();
  const nameIdx = header.includes('nombre') ? header.split(sep).findIndex((c) => c.includes('nombre')) : 0;
  const emailIdx = header.includes('email') || header.includes('mail') || header.includes('correo')
    ? header.split(sep).findIndex((c) => c.includes('email') || c.includes('mail') || c.includes('correo'))
    : 1;
  const rows: { name: string; email: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(sep).map((c) => c.replace(/^"|"$/g, '').trim());
    const name = (cells[nameIdx] ?? '').trim();
    const email = (cells[emailIdx] ?? cells[1] ?? cells[0] ?? '').trim();
    if (email && email.includes('@')) rows.push({ name: name || email, email });
  }
  return rows;
}

const CortesiasBase = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [baseName, setBaseName] = useState('');
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [sendForm, setSendForm] = useState({
    ticketTypeId: '',
    quantityPerRecipient: 1,
    validUntil: '',
    validUntilTime: '23:59',
    authorizationCode: '',
  });

  const { data: eventData } = useQuery({
    queryKey: ['event-stats', eventId],
    queryFn: () => adminApi.getEventStats(eventId!),
    enabled: !!eventId,
  });

  const { data: basesData, isLoading: basesLoading } = useQuery({
    queryKey: ['cortesia-bases', eventId],
    queryFn: () => adminApi.getCortesiaBases(eventId!),
    enabled: !!eventId,
  });

  const event = eventData?.data?.event;
  const ticketTypes = event?.ticketTypes || [];
  const bases = basesData?.data || [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; rows: { name: string; email: string }[] }) =>
      adminApi.createCortesiaBase(eventId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cortesia-bases', eventId] });
      setAddModalOpen(false);
      setBaseName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast({ title: 'Base agregada', description: 'La base de datos se cargó correctamente.' });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'No se pudo agregar la base',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (baseId: string) => adminApi.deleteCortesiaBase(eventId!, baseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cortesia-bases', eventId] });
      setSelectedBaseId(null);
      toast({ title: 'Base eliminada' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message, variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      adminApi.sendCortesiasFromBase(eventId!, {
        baseId: selectedBaseId!,
        ticketTypeId: sendForm.ticketTypeId,
        quantityPerRecipient: sendForm.quantityPerRecipient,
        authorizationCode: event?.authorizationCode ? sendForm.authorizationCode : undefined,
        validUntil: sendForm.validUntil || undefined,
        validUntilTime: sendForm.validUntilTime || undefined,
      }),
    onSuccess: (res) => {
      const d = res?.data;
      toast({
        title: 'Cortesías enviadas',
        description: d?.message || `Enviadas ${d?.sent ?? 0} cortesías.`,
      });
      queryClient.invalidateQueries({ queryKey: ['event-stats', eventId] });
    },
    onError: (e: any) => {
      toast({
        title: 'Error al enviar',
        description: e?.response?.data?.message || e?.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const rows = parseNameEmailFile(text);
      if (rows.length === 0) {
        toast({
          title: 'Archivo sin datos',
          description: 'Usá un CSV o Excel exportado a CSV con columnas "nombre" y "email".',
          variant: 'destructive',
        });
        return;
      }
      const name = baseName.trim() || file.name.replace(/\.[^.]+$/, '');
      createMutation.mutate({ name, rows });
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({ title: 'Seleccioná un archivo', variant: 'destructive' });
      return;
    }
    handleFileChange({ target: { files: [file] } } as any);
  };

  const handleDownload = (baseId: string, name: string) => {
    adminApi.downloadCortesiaBase(eventId!, baseId, name).catch(() =>
      toast({ title: 'Error al descargar', variant: 'destructive' })
    );
  };

  const selectedBase = bases.find((b: any) => b.id === selectedBaseId);
  const canSend = selectedBaseId && sendForm.ticketTypeId && (event?.authorizationCode ? sendForm.authorizationCode : true);

  if (!eventId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-24">Evento no especificado.</div>
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
            <h1 className="text-2xl font-bold">Bases de datos del evento &quot;{event?.title ?? '…'}&quot;</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Cargá un Excel/CSV con columnas <strong>nombre</strong> y <strong>email</strong>, seleccioná la base y enviá las cortesías.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/events/${eventId}/stats`)}
          >
            Revisar envíos
          </Button>
          <Button
            onClick={() => setAddModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar base de datos
          </Button>
        </div>

        {basesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : bases.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No hay bases de datos cargadas</p>
            <p className="text-sm mt-1">Agregá una base con nombre y email para enviar cortesías en masa.</p>
            <Button className="mt-4" onClick={() => setAddModalOpen(true)}>
              Agregar base de datos
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium w-10"></th>
                  <th className="text-left py-3 px-4 font-medium">Nombre</th>
                  <th className="text-left py-3 px-4 font-medium">Cantidad</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha</th>
                  <th className="text-right py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {bases.map((base: any) => (
                  <tr key={base.id} className="border-t">
                    <td className="py-3 px-4">
                      <input
                        type="radio"
                        name="base"
                        checked={selectedBaseId === base.id}
                        onChange={() => setSelectedBaseId(base.id)}
                        className="rounded-full"
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{base.name}</td>
                    <td className="py-3 px-4">{base.quantity}</td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">
                      {new Date(base.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(base.id, base.name)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Descargar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(base.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedBase && (
          <div className="mt-8 p-6 rounded-lg border bg-card">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5" />
              Tickets de base de datos — Enviar cortesías
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Base seleccionada: <strong>{selectedBase.name}</strong> ({selectedBase.quantity} contactos)
            </p>
            <div className="grid gap-4 max-w-md">
              <div>
                <Label>Tipo de ticket *</Label>
                <select
                  value={sendForm.ticketTypeId}
                  onChange={(e) => setSendForm((f) => ({ ...f, ticketTypeId: e.target.value }))}
                  className="w-full h-10 mt-1 rounded-md border border-input bg-background px-3 py-2"
                  required
                >
                  <option value="">Seleccionar tipo de ticket...</option>
                  {ticketTypes.map((tt: any) => (
                    <option key={tt.id} value={tt.id}>
                      {tt.name} — Disponibles: {tt.availableQty ?? tt.totalQty ?? 0}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha de término eTicket</Label>
                  <Input
                    type="date"
                    value={sendForm.validUntil}
                    onChange={(e) => setSendForm((f) => ({ ...f, validUntil: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Hora de término eTicket</Label>
                  <Input
                    type="time"
                    value={sendForm.validUntilTime}
                    onChange={(e) => setSendForm((f) => ({ ...f, validUntilTime: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              {event?.authorizationCode && (
                <div>
                  <Label>Código de autorización *</Label>
                  <Input
                    placeholder="Escribí el código de autorización"
                    value={sendForm.authorizationCode}
                    onChange={(e) => setSendForm((f) => ({ ...f, authorizationCode: e.target.value }))}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Código del evento: {event.authorizationCode}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                El eTicket será válido hasta la fecha y hora indicadas.
              </p>
              <Button
                size="lg"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={!canSend || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                INVITAR ({selectedBase.quantity} destinatarios)
              </Button>
            </div>
          </div>
        )}

        {bases.length > 0 && !selectedBaseId && (
          <p className="mt-6 text-sm text-muted-foreground">
            Seleccioná una base de la tabla para enviar las cortesías (botón INVITAR debajo).
          </p>
        )}
      </main>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar base de datos</DialogTitle>
            <DialogDescription>
              Subí tu base en formato Excel o CSV. Debe tener solo dos columnas: <strong>Nombre completo</strong> y <strong>Email</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <Label>Nombre de la base de datos</Label>
              <Input
                placeholder="Ej: Yamba 14/02"
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Base de datos (Excel o CSV)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    if (e.target.files?.[0] && !baseName) setBaseName(e.target.files[0].name.replace(/\.[^.]+$/, ''));
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Usá un CSV con encabezado &quot;nombre&quot; y &quot;email&quot; (o exportá Excel como CSV).
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                AGREGAR
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CortesiasBase;
