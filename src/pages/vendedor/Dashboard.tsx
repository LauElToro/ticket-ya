import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, ExternalLink, TrendingUp, Users, Ticket, DollarSign, Loader2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { vendedorApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingReferido, setEditingReferido] = useState<string | null>(null);
  const [newCode, setNewCode] = useState('');
  const [showEditAllDialog, setShowEditAllDialog] = useState(false);
  const [allCodesValue, setAllCodesValue] = useState('');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['vendedor-dashboard', user?.id],
    queryFn: () => vendedorApi.getDashboard(),
    enabled: !!user,
  });

  const updateReferidoMutation = useMutation({
    mutationFn: ({ referidoId, customCode }: { referidoId: string; customCode: string }) =>
      vendedorApi.updateReferidoCode(referidoId, customCode),
    onSuccess: () => {
      toast({
        title: '✅ Código actualizado',
        description: 'El código de referido ha sido actualizado exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['vendedor-dashboard', user?.id] });
      setEditingReferido(null);
      setNewCode('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el código.',
        variant: 'destructive',
      });
    },
  });

  const updateAllCodesMutation = useMutation({
    mutationFn: (customCode: string) => vendedorApi.updateAllReferidoCodes(customCode),
    onSuccess: () => {
      toast({
        title: '✅ Códigos actualizados',
        description: 'Todos los códigos de referido han sido actualizados exitosamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['vendedor-dashboard', user?.id] });
      setShowEditAllDialog(false);
      setAllCodesValue('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudieron actualizar los códigos.',
        variant: 'destructive',
      });
    },
  });

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: '✅ Link copiado',
      description: 'El link de referido ha sido copiado al portapapeles.',
    });
  };

  const handleEditReferido = (referido: any) => {
    setEditingReferido(referido.id);
    setNewCode(referido.customCode);
  };

  const handleSaveReferido = (referidoId: string) => {
    if (!newCode.trim()) {
      toast({
        title: 'Error',
        description: 'El código no puede estar vacío.',
        variant: 'destructive',
      });
      return;
    }
    updateReferidoMutation.mutate({ referidoId, customCode: newCode.trim() });
  };

  const handleSaveAllCodes = () => {
    if (!allCodesValue.trim()) {
      toast({
        title: 'Error',
        description: 'El código no puede estar vacío.',
        variant: 'destructive',
      });
      return;
    }
    updateAllCodesMutation.mutate(allCodesValue.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const metrics = dashboardData?.data?.metrics || {
    totalSales: 0,
    totalRevenue: 0,
    totalEarnings: 0,
    totalTicketsSold: 0,
    salesByEvent: [],
  };

  const events = dashboardData?.data?.events || [];
  const referidos = dashboardData?.data?.referidos || [];
  const commissionPercent = dashboardData?.data?.vendedor?.commissionPercent || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard de Vendedor</h1>
            <p className="text-muted-foreground">
              Comisión: {commissionPercent}% | Ganancias totales: ${Number(metrics.totalEarnings).toLocaleString('es-AR')}
            </p>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalSales}</div>
                <p className="text-xs text-muted-foreground">Órdenes completadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas Vendidas</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTicketsSold}</div>
                <p className="text-xs text-muted-foreground">Total de tickets</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${Number(metrics.totalRevenue).toLocaleString('es-AR')}</div>
                <p className="text-xs text-muted-foreground">En ventas generadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tus Ganancias</CardTitle>
                <DollarSign className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary">${Number(metrics.totalEarnings).toLocaleString('es-AR')}</div>
                <p className="text-xs text-muted-foreground">{commissionPercent}% de comisión</p>
              </CardContent>
            </Card>
          </div>

          {/* Ventas por evento */}
          {metrics.salesByEvent && metrics.salesByEvent.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Ventas por Evento</h2>
              <div className="space-y-4">
                {metrics.salesByEvent.map((sale: any, index: number) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg">{sale.event.title}</CardTitle>
                      <CardDescription>
                        {new Date(sale.event.date).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Entradas Vendidas</p>
                          <p className="text-2xl font-bold">{sale.ticketsSold}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Ingresos Generados</p>
                          <p className="text-2xl font-bold">${Number(sale.revenue).toLocaleString('es-AR')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Tu Comisión</p>
                          <p className="text-2xl font-bold text-secondary">
                            ${Number((sale.revenue * commissionPercent) / 100).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Clientes:</p>
                        <div className="space-y-1">
                          {sale.orders.slice(0, 5).map((order: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{order.user?.name || 'Cliente'}</span>
                              <span className="text-muted-foreground">
                                {order.tickets.length} entrada{order.tickets.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          ))}
                          {sale.orders.length > 5 && (
                            <p className="text-xs text-muted-foreground">
                              +{sale.orders.length - 5} cliente{sale.orders.length - 5 > 1 ? 's' : ''} más
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Eventos asignados */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Eventos Asignados</h2>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((ve: any) => (
                  <Card key={ve.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{ve.event.title}</CardTitle>
                      <CardDescription>
                        {new Date(ve.event.date).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Vendidas:</span>
                          <span className="font-semibold">{ve.soldQty}</span>
                        </div>
                        {ve.ticketLimit && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Límite:</span>
                            <span className="font-semibold">{ve.ticketLimit}</span>
                          </div>
                        )}
                        {ve.ticketLimit && (
                          <div className="mt-2">
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-secondary h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min((ve.soldQty / ve.ticketLimit) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {Math.round((ve.soldQty / ve.ticketLimit) * 100)}% del límite
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tenés eventos asignados aún.
                </CardContent>
              </Card>
            )}
          </div>

          {/* Links de referido */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Links de Referido</h2>
              <Button onClick={() => setShowEditAllDialog(true)} variant="outline" size="sm">
                <Edit2 className="w-4 h-4 mr-2" />
                Personalizar todos
              </Button>
            </div>
            {referidos.length > 0 ? (
              <div className="space-y-4">
                {referidos.map((referido: any) => (
                  <Card key={referido.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-2">{referido.event.title}</h3>
                          <div className="space-y-2">
                            {editingReferido === referido.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newCode}
                                  onChange={(e) => setNewCode(e.target.value)}
                                  placeholder="Código personalizado"
                                  className="flex-1"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveReferido(referido.id)}
                                  disabled={updateReferidoMutation.isPending}
                                >
                                  {updateReferidoMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingReferido(null);
                                    setNewCode('');
                                  }}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <code className="px-2 py-1 bg-muted rounded text-sm">{referido.customCode}</code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditReferido(referido)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Input
                                value={referido.customUrl}
                                readOnly
                                className="flex-1 font-mono text-sm"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(referido.customUrl)}
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(referido.customUrl, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>Clics: {referido.clickCount}</span>
                              <span>Conversiones: {referido.conversionCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No tenés links de referido aún. Los links se generan automáticamente cuando se te asignan eventos.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Dialog para personalizar todos los códigos */}
      <Dialog open={showEditAllDialog} onOpenChange={setShowEditAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personalizar todos los códigos</DialogTitle>
            <DialogDescription>
              Este código se aplicará a todos tus links de referido.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="allCodes">Código personalizado</Label>
              <Input
                id="allCodes"
                value={allCodesValue}
                onChange={(e) => setAllCodesValue(e.target.value)}
                placeholder="Ej: MI-CODIGO"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditAllDialog(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveAllCodes}
                disabled={updateAllCodesMutation.isPending}
              >
                {updateAllCodesMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Dashboard;

