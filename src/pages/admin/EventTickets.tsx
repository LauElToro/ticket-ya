import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Ticket,
  Plus,
  Pencil,
  Lock,
  Gift,
  CheckCircle2,
  Upload,
} from 'lucide-react';

const TICKET_KINDS = [{ value: 'Presencial', label: 'Ticket Presencial' }];
const STATUS_OPTIONS = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Agotado', label: 'Agotado' },
  { value: 'Cortesia', label: 'Cortesía' },
  { value: 'Cerrado', label: 'Cerrado' },
  { value: 'Venta solo RRPP', label: 'Venta solo RRPP' },
  { value: 'Oculto', label: 'Oculto' },
];

const generateTimeOptions = () => {
  const t: string[] = [];
  for (let h = 0; h < 24; h++)
    for (let m = 0; m < 60; m += 5)
      t.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  return t;
};

const EventTickets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    ticketKind: 'Presencial',
    status: 'Activo',
    price: '',
    quantity: '1',
    saleEndDate: '',
    saleEndTime: '',
    validUntil: '',
    validUntilTime: '',
    image: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => adminApi.getEventById(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => adminApi.createTicketType(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
      queryClient.invalidateQueries({ queryKey: ['event-stats', id] });
      setModalOpen(false);
      resetForm();
      toast({ title: 'Ticket agregado', description: 'El tipo de entrada se creó correctamente.' });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'No se pudo crear el ticket',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ ticketTypeId, body }: { ticketTypeId: string; body: any }) =>
      adminApi.updateTicketType(id!, ticketTypeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
      queryClient.invalidateQueries({ queryKey: ['event-stats', id] });
      setModalOpen(false);
      setEditingId(null);
      resetForm();
      toast({ title: 'Ticket actualizado', description: 'Cambios guardados.' });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'No se pudo actualizar',
        variant: 'destructive',
      });
    },
  });

  const event = data?.data;
  const ticketTypes = event?.ticketTypes || [];
  const tandas = event?.tandas || [];

  const getPriceForTicketType = (ticketTypeId: string) => {
    for (const tanda of tandas) {
      const ttt = tanda.tandaTicketTypes?.find((ttt: any) => ttt.ticketTypeId === ticketTypeId);
      if (ttt?.price != null) return Number(ttt.price);
    }
    return 0;
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      ticketKind: 'Presencial',
      status: 'Activo',
      price: '',
      quantity: '1',
      saleEndDate: '',
      saleEndTime: '',
      validUntil: '',
      validUntilTime: '',
      image: '',
    });
  };

  const openAdd = () => {
    setEditingId(null);
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (tt: any) => {
    setEditingId(tt.id);
    const price = getPriceForTicketType(tt.id);
    setForm({
      name: tt.name || '',
      description: tt.description || '',
      ticketKind: tt.ticketKind || 'Presencial',
      status: tt.status || 'Activo',
      price: String(price),
      quantity: String(tt.totalQty ?? 0),
      saleEndDate: tt.saleEndDate ? new Date(tt.saleEndDate).toISOString().split('T')[0] : '',
      saleEndTime: tt.saleEndTime || '',
      validUntil: tt.validUntil ? new Date(tt.validUntil).toISOString().split('T')[0] : '',
      validUntilTime: tt.validUntilTime || '',
      image: tt.image || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      toast({ title: 'Nombre requerido', variant: 'destructive' });
      return;
    }
    const body = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      ticketKind: form.ticketKind,
      status: form.status,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity, 10) || 1,
      saleEndDate: form.saleEndDate || undefined,
      saleEndTime: form.saleEndTime || undefined,
      validUntil: form.validUntil || undefined,
      validUntilTime: form.validUntilTime || undefined,
      image: form.image || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ ticketTypeId: editingId, body });
    } else {
      createMutation.mutate(body);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast({ title: 'Máximo 1 MB', variant: 'destructive' });
      return;
    }
    setUploadingImage(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success) setForm((f) => ({ ...f, image: res.data.url }));
    } catch (err) {
      toast({ title: 'Error al subir imagen', variant: 'destructive' });
    } finally {
      setUploadingImage(false);
      fileInputRef.current && (fileInputRef.current.value = '');
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const timeOptions = generateTimeOptions();

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
  const authCode = event.authorizationCode || id?.slice(-6) || '';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 pt-24 pb-16">
        <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al evento
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl font-semibold text-muted-foreground">
            eTickets de: {authCode} - {eventTitle}
          </h1>
          <Button onClick={openAdd} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Agregar Nuevo Ticket
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Nombre del ticket</th>
                <th className="text-left py-3 px-4 font-medium">Disponibles</th>
                <th className="text-left py-3 px-4 font-medium">Comprados</th>
                <th className="text-left py-3 px-4 font-medium">Devueltos</th>
                <th className="text-left py-3 px-4 font-medium">Cortesías</th>
                <th className="text-left py-3 px-4 font-medium">Validadas</th>
                <th className="text-left py-3 px-4 font-medium">Valor</th>
                <th className="text-left py-3 px-4 font-medium">Total</th>
                <th className="text-right py-3 px-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ticketTypes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    Aún no hay tipos de entrada. Clic en &quot;Agregar Nuevo Ticket&quot; para crear uno.
                  </td>
                </tr>
              ) : (
                ticketTypes.map((tt: any) => {
                  const price = getPriceForTicketType(tt.id);
                  const total = (tt.soldQty || 0) * price;
                  const statusIcon =
                    tt.status === 'Cortesia' ? (
                      <Gift className="w-4 h-4 text-amber-500" />
                    ) : tt.status === 'Activo' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    );
                  return (
                    <tr key={tt.id} className="border-t">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {statusIcon}
                          <span className="font-medium">{tt.name}</span>
                          <span className="text-muted-foreground text-xs">({tt.status})</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {tt.availableQty ?? 0} de {tt.totalQty ?? 0}
                      </td>
                      <td className="py-3 px-4">{tt.soldQty ?? 0}</td>
                      <td className="py-3 px-4">0</td>
                      <td className="py-3 px-4">0</td>
                      <td className="py-3 px-4">0</td>
                      <td className="py-3 px-4">{formatCurrency(price)}</td>
                      <td className="py-3 px-4">{formatCurrency(total)}</td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                          onClick={() => openEdit(tt)}
                        >
                          EDITAR
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm('¿Cerrar venta de este ticket?')) {
                              updateMutation.mutate({
                                ticketTypeId: tt.id,
                                body: { status: 'Cerrado' },
                              });
                            }
                          }}
                        >
                          CERRAR
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {ticketTypes.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Devoluciones $0. — Total ${ticketTypes.reduce((s: number, tt: any) => s + (tt.soldQty || 0) * getPriceForTicketType(tt.id), 0).toLocaleString('es-AR')}.
          </div>
        )}
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar ticket" : "Agregar ticket para '" + eventTitle + "'"}
            </DialogTitle>
            <DialogDescription>
              Si necesitás vender eTickets debes configurar el tipo de entrada. Precio $0 = gratuito. Siempre podés crear tus eTickets más adelante.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo de entrada</Label>
              <select
                value={form.ticketKind}
                onChange={(e) => setForm((f) => ({ ...f, ticketKind: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border bg-background mt-1"
              >
                {TICKET_KINDS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Estado</Label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border bg-background mt-1"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Nombre del ticket *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Entrada General"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Descripción</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Características de este tipo de entrada"
                rows={3}
                className="mt-1 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cant. disponible</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Día y hora en que termina la venta de este ticket</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={form.saleEndDate}
                  onChange={(e) => setForm((f) => ({ ...f, saleEndDate: e.target.value }))}
                  className="flex-1"
                />
                <select
                  value={form.saleEndTime}
                  onChange={(e) => setForm((f) => ({ ...f, saleEndTime: e.target.value }))}
                  className="w-24 h-10 px-2 rounded-md border bg-background"
                >
                  <option value="">--</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Los tickets serán válidos hasta</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                  className="flex-1"
                />
                <select
                  value={form.validUntilTime}
                  onChange={(e) => setForm((f) => ({ ...f, validUntilTime: e.target.value }))}
                  className="w-24 h-10 px-2 rounded-md border bg-background"
                >
                  <option value="">--</option>
                  {timeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Personalizá tu eTicket con una imagen</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tamaño 500×500 px, peso máx. 1 MB. Esta imagen se envía en el mail cuando el comprador recibe el ticket. Si no cargás ninguna, se usa la imagen del evento.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  Seleccionar archivo
                </Button>
                <span className="text-xs text-muted-foreground">
                  {form.image ? 'Imagen cargada' : 'ningún archivo seleccionado'}
                </span>
              </div>
            </div>
            <div>
              <Label>Código de autorización</Label>
              <Input
                value={event.authorizationCode || ''}
                readOnly
                className="mt-1 bg-muted"
                placeholder="Se genera al crear el evento"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingId ? 'Guardar' : 'Agregar ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EventTickets;
