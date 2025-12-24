import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, ExternalLink, TrendingUp, Users, Ticket, DollarSign, Loader2, Edit2, Check, X, Calendar } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header mejorado */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-12 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Dashboard de Vendedor
                </h1>
                <p className="text-muted-foreground mt-1 text-lg">
                  Comisión: <span className="font-semibold text-secondary">{commissionPercent}%</span> | 
                  Ganancias totales: <span className="font-semibold text-secondary">${Number(metrics.totalEarnings).toLocaleString('es-AR')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Métricas principales - Mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Ventas Totales</CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {metrics.totalSales}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Órdenes completadas</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Entradas Vendidas</CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  {metrics.totalTicketsSold}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Total de tickets</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Ingresos Totales</CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(metrics.totalRevenue))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">En ventas generadas</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-secondary/10 to-card/80 backdrop-blur-sm group border-secondary/30">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-secondary">Tus Ganancias</CardTitle>
                <div className="p-2 rounded-lg bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                  <DollarSign className="h-5 w-5 text-secondary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                  ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(metrics.totalEarnings))}
                </div>
                <p className="text-xs text-muted-foreground font-medium">{commissionPercent}% de comisión</p>
              </CardContent>
            </Card>
          </div>

          {/* Ventas por evento - Mejorado */}
          {metrics.salesByEvent && metrics.salesByEvent.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
                <h2 className="text-3xl font-bold">Ventas por Evento</h2>
              </div>
              <div className="space-y-6">
                {metrics.salesByEvent.map((sale: any, index: number) => (
                  <Card key={index} className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <Ticket className="h-5 w-5 text-secondary" />
                        </div>
                        {sale.event.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {new Date(sale.event.date).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">Entradas Vendidas</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            {sale.ticketsSold}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">Ingresos Generados</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                            ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(sale.revenue))}
                          </p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 border border-secondary/30">
                          <p className="text-sm font-semibold text-secondary mb-2">Tu Comisión</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                            ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number((sale.revenue * commissionPercent) / 100))}
                          </p>
                        </div>
                      </div>
                      {sale.orders && sale.orders.length > 0 && (
                        <div className="mt-6 pt-6 border-t-2 border-border">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-base font-bold text-muted-foreground">Clientes ({sale.orders.length})</p>
                            {sale.orders.length > 5 && (
                              <p className="text-xs text-muted-foreground">
                                Mostrando 5 de {sale.orders.length}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {sale.orders.slice(0, 5).map((order: any, idx: number) => (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/80 transition-all duration-200 border border-border/50"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-xs font-bold text-secondary">
                                    {idx + 1}
                                  </div>
                                  <span className="font-semibold">{order.user?.name || 'Cliente'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Ticket className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground font-bold">
                                    {order.tickets.length} entrada{order.tickets.length > 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {sale.orders.length > 5 && (
                              <div className="pt-2 border-t border-border/50">
                                <p className="text-xs text-muted-foreground text-center font-medium">
                                  +{sale.orders.length - 5} cliente{sale.orders.length - 5 > 1 ? 's' : ''} más
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(!sale.orders || sale.orders.length === 0) && (
                        <div className="mt-6 pt-6 border-t-2 border-border">
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay clientes registrados para este evento aún.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Eventos asignados - Mejorado */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
              <h2 className="text-3xl font-bold">Eventos Asignados</h2>
            </div>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((ve: any) => (
                  <Card key={ve.id} className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-secondary/10">
                          <Calendar className="h-4 w-4 text-secondary" />
                        </div>
                        {ve.event.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {new Date(ve.event.date).toLocaleDateString('es-AR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                          <span className="text-sm font-semibold text-muted-foreground">Vendidas:</span>
                          <span className="text-xl font-bold text-secondary">{ve.soldQty}</span>
                        </div>
                        {ve.ticketLimit && (
                          <>
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                              <span className="text-sm font-semibold text-muted-foreground">Límite:</span>
                              <span className="text-lg font-bold">{ve.ticketLimit}</span>
                            </div>
                            <div className="mt-3">
                              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-secondary to-secondary/80 h-3 rounded-full transition-all duration-500 shadow-sm"
                                  style={{
                                    width: `${Math.min((ve.soldQty / ve.ticketLimit) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-2 text-center font-semibold">
                                {Math.round((ve.soldQty / ve.ticketLimit) * 100)}% del límite alcanzado
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-lg">No tenés eventos asignados aún.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Links de referido - Mejorado */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
                <h2 className="text-3xl font-bold">Links de Referido</h2>
              </div>
              <Button 
                onClick={() => setShowEditAllDialog(true)} 
                variant="outline" 
                size="lg"
                className="border-2 hover:border-secondary hover:bg-secondary/5 transition-all duration-300"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Personalizar todos
              </Button>
            </div>
            {referidos.length > 0 ? (
              <div className="space-y-6">
                {referidos.map((referido: any) => (
                  <Card key={referido.id} className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-secondary/10">
                              <Ticket className="h-5 w-5 text-secondary" />
                            </div>
                            <h3 className="font-bold text-lg">{referido.event.title}</h3>
                          </div>
                          <div className="space-y-4">
                            {editingReferido === referido.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={newCode}
                                  onChange={(e) => setNewCode(e.target.value)}
                                  placeholder="Código personalizado"
                                  className="flex-1 border-2"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveReferido(referido.id)}
                                  disabled={updateReferidoMutation.isPending}
                                  className="bg-secondary hover:bg-secondary/90"
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
                                <code className="px-4 py-2 bg-muted rounded-lg text-sm font-semibold border-2">
                                  {referido.customCode}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditReferido(referido)}
                                  className="hover:bg-secondary/10"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Input
                                value={referido.customUrl}
                                readOnly
                                className="flex-1 font-mono text-sm border-2 bg-muted/50"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyLink(referido.customUrl)}
                                className="border-2 hover:border-secondary hover:bg-secondary/5"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(referido.customUrl, '_blank')}
                                className="border-2 hover:border-secondary hover:bg-secondary/5"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-6 p-3 rounded-lg bg-muted/50">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-muted-foreground">Clics:</span>
                                <span className="text-base font-bold">{referido.clickCount}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-muted-foreground">Conversiones:</span>
                                <span className="text-base font-bold text-secondary">{referido.conversionCount}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground text-lg">
                    No tenés links de referido aún. Los links se generan automáticamente cuando se te asignan eventos.
                  </p>
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

