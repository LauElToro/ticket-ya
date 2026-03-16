import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Loader2, BarChart3, PieChart as PieChartIcon, FileSpreadsheet, Search } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#a4de6c', '#d0ed57', '#83a6ed'];

const EventSalesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rrpp, setRrpp] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [email, setEmail] = useState('');
  const [showResumenModal, setShowResumenModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['event-sales-details', id, rrpp, tipo, estado, email],
    queryFn: () =>
      adminApi.getEventSalesDetails(id!, { rrpp: rrpp || undefined, tipo: tipo || undefined, estado: estado || undefined, email: email || undefined }),
    enabled: !!id,
  });

  const result = data?.data;
  const tickets = result?.tickets ?? [];
  const summary = result?.summary ?? {};
  const promotores = result?.promotores ?? [];
  const ticketTypes = result?.ticketTypes ?? [];

  const resumenPorTipo = useMemo(() => {
    const byTipo: Record<string, { name: string; count: number; total: number }> = {};
    tickets.forEach((t: any) => {
      const name = t.tipo || 'Sin tipo';
      if (!byTipo[name]) byTipo[name] = { name, count: 0, total: 0 };
      byTipo[name].count += 1;
      byTipo[name].total += Number(t.precio ?? 0);
    });
    return Object.values(byTipo).sort((a, b) => b.total - a.total);
  }, [tickets]);

  const handleExportExcel = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Fecha adquisición', 'Tipo', 'RRPP', 'Estado', 'Fecha entrada', 'Forma pago', 'Precio'];
    const rows = tickets.map((t: any) => [
      t.nombre,
      t.email,
      t.telefono,
      t.fechaAdquisicion ? new Date(t.fechaAdquisicion).toLocaleString('es-AR') : '',
      t.tipo,
      t.rrpp,
      t.estado,
      t.fechaEntrada ? new Date(t.fechaEntrada).toLocaleString('es-AR') : '',
      t.formaPago,
      String(t.precio ?? 0),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-etickets-${id}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error || !id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24">
          <p className="text-muted-foreground">Error o evento no especificado.</p>
          <Button variant="ghost" onClick={() => navigate('/admin/events')}>Volver</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/events/${id}`)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detalles de ventas eTickets</h1>
            <p className="text-muted-foreground text-sm">Filtrado por ticket vendido y cortesías. Validada = QR escaneado.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button variant="outline" onClick={() => navigate(`/admin/events/${id}/stats`)}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Gráfica
          </Button>
          <Button variant="outline" onClick={() => setShowResumenModal(true)}>
            <PieChartIcon className="w-4 h-4 mr-2" />
            Ver Resumen
          </Button>
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Formato Excel
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total eTicket</p>
            <p className="text-2xl font-bold">{summary.totalTickets ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total vendidas</p>
            <p className="text-2xl font-bold">{summary.totalVendidas ?? 0}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total cortesías</p>
            <p className="text-2xl font-bold">{summary.totalCortesias ?? 0}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 mb-6">
          <p className="text-sm font-medium mb-3">Filtros</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">RRPP</label>
              <select
                value={rrpp}
                onChange={(e) => setRrpp(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 min-w-[160px]"
              >
                <option value="">Todos</option>
                {promotores.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 min-w-[180px]"
              >
                <option value="">Todos</option>
                {ticketTypes.map((tt: any) => (
                  <option key={tt.id} value={tt.id}>{tt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="h-9 rounded-md border bg-background px-3 min-w-[120px]"
              >
                <option value="">Todos</option>
                <option value="Vigente">Vigente</option>
                <option value="Validada">Validada</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Email</label>
              <Input
                placeholder="Buscar por email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 w-48"
              />
            </div>
            <Button size="sm" className="h-9">
              <Search className="w-4 h-4 mr-1" />
              Buscar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium">Teléfono</th>
                    <th className="text-left py-3 px-4 font-medium">Fecha adquisición</th>
                    <th className="text-left py-3 px-4 font-medium">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium">RRPP</th>
                    <th className="text-left py-3 px-4 font-medium">Estado</th>
                    <th className="text-left py-3 px-4 font-medium">Forma pago</th>
                    <th className="text-right py-3 px-4 font-medium">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t: any) => (
                    <tr key={t.id} className="border-t">
                      <td className="py-3 px-4">{t.nombre ?? '-'}</td>
                      <td className="py-3 px-4">{t.email ?? '-'}</td>
                      <td className="py-3 px-4">{t.telefono ?? '-'}</td>
                      <td className="py-3 px-4 text-sm">
                        {t.fechaAdquisicion
                          ? new Date(t.fechaAdquisicion).toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="py-3 px-4">{t.tipo ?? '-'}</td>
                      <td className="py-3 px-4">{t.rrpp ?? '-'}</td>
                      <td className="py-3 px-4">
                        <span>{t.estado ?? 'Vigente'}</span>
                        {t.fechaEntrada && (
                          <span className="block text-xs text-muted-foreground">
                            {new Date(t.fechaEntrada).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{t.formaPago ?? '-'}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        ${typeof t.precio === 'number' ? t.precio.toLocaleString('es-AR') : (t.precio ?? '0')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Resumen</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-xl font-bold">${Number(summary.subtotal ?? 0).toLocaleString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Solicitudes de Devolución</p>
                  <p className="text-xl font-bold">${Number(summary.solicitudesDevolucion ?? 0).toLocaleString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">${Number(summary.total ?? 0).toLocaleString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tickets emitidos válidos</p>
                  <p className="text-xl font-bold">{summary.ticketsEmitidosValidos ?? 0}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Dialog open={showResumenModal} onOpenChange={setShowResumenModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resumen de ventas por tipo de eTicket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {resumenPorTipo.map((item, i) => (
                <li key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1">{item.name}</span>
                  <span className="font-medium">{item.count} Tickets</span>
                  <span className="text-muted-foreground">Total: ${item.total.toLocaleString('es-AR')}</span>
                </li>
              ))}
            </ul>
            {resumenPorTipo.length > 0 && (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={resumenPorTipo}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {resumenPorTipo.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString('es-AR')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default EventSalesDetails;
