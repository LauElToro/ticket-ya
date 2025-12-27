import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Ticket, DollarSign, TrendingUp, BarChart3, LineChart as LineChartIcon, Activity, ArrowLeft, Download, Settings, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AccountingConfig from '@/components/admin/AccountingConfig';
import { exportSalesToExcel, exportAllMetricsToExcel, getAccountingConfig, calculateAccounting } from '@/utils/excelExport';
import { toast } from '@/hooks/use-toast';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe', '#ff00ff'];

const Metrics = () => {
  const navigate = useNavigate();
  const [accountingConfig, setAccountingConfig] = useState(getAccountingConfig());
  const [showAccountingConfig, setShowAccountingConfig] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const dashboard = data?.data;

  // Cargar configuración contable del localStorage
  useEffect(() => {
    const stored = localStorage.getItem('accounting-config');
    if (stored) {
      setAccountingConfig(JSON.parse(stored));
    }
  }, []);

  // Calcular valores contables para todos los eventos
  const eventsWithAccounting = useMemo(() => {
    if (!dashboard?.topEvents) return [];
    return dashboard.topEvents.map((event: any) => {
      const revenue = event.revenue || 0;
      const accounting = calculateAccounting(revenue, accountingConfig);
      return {
        ...event,
        accounting,
      };
    });
  }, [dashboard?.topEvents, accountingConfig]);

  if (isLoading) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando métricas...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Preparar datos para gráficos con contabilidad
  const monthlySalesData = dashboard?.monthlySales?.map((item: any) => {
    const accounting = calculateAccounting(item.amount, accountingConfig);
    return {
      ...item,
      monthName: new Date(item.month + '-01').toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
      revenue: item.amount,
      costs: accounting.totalCosts,
      grossProfit: accounting.grossProfit,
      netProfit: accounting.netProfit,
    };
  }) || [];

  // Preparar datos de eventos con contabilidad para gráficos
  const topEventsData = useMemo(() => {
    if (!dashboard?.topEvents || dashboard.topEvents.length === 0) return [];
    return dashboard.topEvents.slice(0, 10).map((event: any) => {
      const revenue = Number(event.revenue) || 0;
      const accounting = calculateAccounting(revenue, accountingConfig);
      return {
        name: event.title.length > 25 ? event.title.substring(0, 25) + '...' : event.title,
        fullTitle: event.title,
        tickets: event._count?.tickets || 0,
        revenue: revenue,
        costs: accounting.totalCosts,
        grossProfit: accounting.grossProfit,
        netProfit: accounting.netProfit,
      };
    });
  }, [dashboard?.topEvents, accountingConfig]);

  const categoryDistribution = dashboard?.events?.reduce((acc: any, event: any) => {
    const category = event.category || 'Sin categoría';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {}) || {};

  const categoryData = Object.entries(categoryDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  const cityDistribution = dashboard?.events?.reduce((acc: any, event: any) => {
    const city = event.city || 'Sin ciudad';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {}) || {};

  const cityData = Object.entries(cityDistribution).map(([name, value]) => ({
    name,
    value,
  }));

  // Calcular promedios y tendencias
  const avgRevenuePerEvent = dashboard?.stats?.totalEvents > 0 
    ? (dashboard?.stats?.totalRevenue || 0) / dashboard.stats.totalEvents 
    : 0;

  const avgTicketsPerEvent = dashboard?.stats?.totalEvents > 0
    ? (dashboard?.stats?.totalTickets || 0) / dashboard.stats.totalEvents
    : 0;

  // Calcular total de tickets disponibles
  const totalTicketsAvailable = dashboard?.events?.reduce((sum: number, e: any) => {
    const total = e.ticketTypes?.reduce((s: number, tt: any) => s + (tt.totalQty || 0), 0) || 0;
    return sum + total;
  }, 0) || 0;

  const totalTicketsSold = dashboard?.stats?.totalTickets || 0;
  const totalTickets = totalTicketsSold + totalTicketsAvailable;
  
  const conversionRate = totalTickets > 0
    ? (totalTicketsSold / totalTickets) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-300">
      <Header />
      <main className="pt-16 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Header mejorado */}
          <div className="mb-6 sm:mb-10">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/dashboard')}
              className="mb-4 sm:mb-6 hover:bg-secondary/10 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Volver al Dashboard</span>
              <span className="sm:hidden">Volver</span>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-1 h-8 sm:h-12 bg-gradient-to-b from-secondary to-primary rounded-full flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex-shrink-0">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-secondary" />
                  </div>
                  <span className="break-words">Métricas Detalladas</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg break-words">Análisis completo y estadísticas avanzadas de tu plataforma</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
              <TabsList className="grid w-full grid-cols-4 min-w-max sm:min-w-0">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Resumen</TabsTrigger>
                <TabsTrigger value="sales" className="text-xs sm:text-sm">Ventas</TabsTrigger>
                <TabsTrigger value="events" className="text-xs sm:text-sm">Eventos</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm">Análisis</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab: Resumen General */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPIs Principales - Mejorados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Total Eventos</CardTitle>
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                      {dashboard?.stats?.totalEvents || 0}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      {dashboard?.upcomingEvents?.length || 0} próximos
                    </p>
                    <div className="mt-3 flex items-center text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full w-fit">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>Activos</span>
                    </div>
                  </CardContent>
                </Card>

                {dashboard?.stats?.totalUsers !== undefined && (
                  <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">Total Usuarios</CardTitle>
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                        <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                        {dashboard.stats.totalUsers}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium mt-1">
                        Usuarios registrados
                      </p>
                      <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full w-fit">
                        <Activity className="w-3 h-3 mr-1" />
                        <span>Crecimiento constante</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Total Entradas</CardTitle>
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                      <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                      {dashboard?.stats?.totalTickets || 0}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Entradas vendidas
                    </p>
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs font-semibold border-2">
                        {conversionRate.toFixed(1)}% conversión
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-semibold text-muted-foreground">Ingresos Totales</CardTitle>
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                      <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1 bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                      ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(dashboard?.stats?.totalRevenue || 0))}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      Promedio: ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(avgRevenuePerEvent)} por evento
                    </p>
                    <div className="mt-3 flex items-center text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full w-fit">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      <span>Ingresos generados</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Métricas Adicionales - Mejoradas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Promedio por Evento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-semibold text-muted-foreground">Entradas promedio</span>
                      <span className="font-bold text-lg">{avgTicketsPerEvent.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-semibold text-muted-foreground">Ingresos promedio</span>
                      <span className="font-bold text-lg">
                        ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(avgRevenuePerEvent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-semibold text-muted-foreground">Tasa de conversión</span>
                      <span className="font-bold text-lg text-secondary">{conversionRate.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      Distribución por Categoría
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {categoryData.slice(0, 5).map((item: any, index: number) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-lg">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Distribución por Ciudad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {cityData.slice(0, 5).map((item: any, index: number) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full shadow-sm" 
                              style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }}
                            />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold text-lg">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Ventas */}
            <TabsContent value="sales" className="space-y-6">
              {/* Configuración Contable y Botones de Exportación */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Dialog open={showAccountingConfig} onOpenChange={setShowAccountingConfig}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      <Settings className="w-4 h-4 mr-2" />
                      Configurar Contabilidad
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Configuración Contable</DialogTitle>
                      <DialogDescription>
                        Personaliza los parámetros contables para calcular ganancias, costos y neto
                      </DialogDescription>
                    </DialogHeader>
                    <AccountingConfig
                      config={accountingConfig}
                      onSave={(config) => {
                        setAccountingConfig(config);
                        setShowAccountingConfig(false);
                        toast({
                          title: 'Configuración guardada',
                          description: 'La configuración contable se ha guardado correctamente',
                        });
                      }}
                    />
                  </DialogContent>
                </Dialog>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (!dashboard?.topEvents) {
                        toast({
                          title: 'Error',
                          description: 'No hay datos de eventos disponibles',
                          variant: 'destructive',
                        });
                        return;
                      }
                      const salesData = dashboard.topEvents.map((event: any) => ({
                        eventId: event.id,
                        eventTitle: event.title,
                        eventDate: new Date(event.date).toLocaleDateString('es-AR'),
                        ticketsSold: event._count?.tickets || 0,
                        revenue: event.revenue || 0,
                      }));
                      exportSalesToExcel(salesData, accountingConfig);
                      toast({
                        title: 'Excel descargado',
                        description: 'El archivo de ventas contables se ha descargado correctamente',
                      });
                    }}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Descargar Ventas (Excel)
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (!dashboard) {
                        toast({
                          title: 'Error',
                          description: 'No hay datos disponibles',
                          variant: 'destructive',
                        });
                        return;
                      }
                      exportAllMetricsToExcel(
                        {
                          events: dashboard.topEvents || [],
                          monthlySales: dashboard.monthlySales || [],
                          metaMetrics: [], // TODO: Integrar métricas de Meta
                          googleAdsMetrics: [], // TODO: Integrar métricas de Google Ads
                        },
                        accountingConfig
                      );
                      toast({
                        title: 'Excel descargado',
                        description: 'El archivo completo de métricas se ha descargado correctamente',
                      });
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Todas las Métricas
                  </Button>
                </div>
              </div>

              {/* Resumen Contable */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const totalRevenue = eventsWithAccounting.reduce((sum, e) => sum + (e.accounting.revenue || 0), 0);
                  const totalCosts = eventsWithAccounting.reduce((sum, e) => sum + (e.accounting.totalCosts || 0), 0);
                  const totalGrossProfit = eventsWithAccounting.reduce((sum, e) => sum + (e.accounting.grossProfit || 0), 0);
                  const totalNetProfit = eventsWithAccounting.reduce((sum, e) => sum + (e.accounting.netProfit || 0), 0);

                  return (
                    <>
                      <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">Ingresos Brutos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(totalRevenue)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Total de ventas</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">Total Costos</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(totalCosts)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Costos totales</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">Ganancia Bruta</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(totalGrossProfit)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Ingresos - Costos</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-muted-foreground">Ganancia Neta</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold text-primary">
                            ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(totalNetProfit)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Ganancia final</p>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de ventas por mes con contabilidad - Mejorado */}
                {monthlySalesData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <LineChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Evolución Financiera Mensual
                      </CardTitle>
                      <CardDescription className="text-base">
                        Últimos 6 meses - Ingresos, costos y ganancias
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <div className="min-w-[400px] h-[350px] sm:h-[400px] md:h-[450px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={monthlySalesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorCosts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorNetProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="monthName"
                              tick={{ fontSize: 11 }}
                            />
                            <YAxis 
                              tickFormatter={(value) => `$${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 0 }).format(value)}`}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip 
                              formatter={(value: number, name: string) => {
                                const formatted = `$${new Intl.NumberFormat('es-AR').format(value)}`;
                                const labels: Record<string, string> = {
                                  revenue: 'Ingresos Brutos',
                                  costs: 'Total Costos',
                                  netProfit: 'Ganancia Neta',
                                };
                                return [formatted, labels[name] || name];
                              }}
                              contentStyle={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                border: '1px solid #ccc', 
                                borderRadius: '8px',
                                padding: '10px',
                              }}
                            />
                            <Legend 
                              formatter={(value) => {
                                const labels: Record<string, string> = {
                                  revenue: 'Ingresos Brutos',
                                  costs: 'Total Costos',
                                  netProfit: 'Ganancia Neta',
                                };
                                return labels[value] || value;
                              }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="#22c55e" 
                              fillOpacity={0.6} 
                              fill="url(#colorRevenue)" 
                              name="revenue"
                              strokeWidth={2}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="costs" 
                              stroke="#ef4444" 
                              fillOpacity={0.4} 
                              fill="url(#colorCosts)" 
                              name="costs"
                              strokeWidth={2}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="netProfit" 
                              stroke="#8b5cf6" 
                              fillOpacity={0.6} 
                              fill="url(#colorNetProfit)" 
                              name="netProfit"
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>

              {/* Tabla Detallada de Eventos con Contabilidad */}
              {eventsWithAccounting.length > 0 && (
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="break-words">Detalle Contable por Evento</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Análisis completo de ingresos, costos y ganancias por evento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b-2 border-border">
                            <th className="text-left p-3 text-sm font-semibold">Evento</th>
                            <th className="text-right p-3 text-sm font-semibold">Ingresos</th>
                            <th className="text-right p-3 text-sm font-semibold">Costos</th>
                            <th className="text-right p-3 text-sm font-semibold">Ganancia Bruta</th>
                            <th className="text-right p-3 text-sm font-semibold">Ganancia Neta</th>
                            <th className="text-right p-3 text-sm font-semibold">% Margen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {eventsWithAccounting.map((event: any) => {
                            const margin = event.accounting.revenue > 0
                              ? ((event.accounting.netProfit / event.accounting.revenue) * 100).toFixed(1)
                              : '0.0';
                            return (
                              <tr key={event.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                                <td className="p-3">
                                  <div>
                                    <p className="font-semibold text-sm">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(event.date).toLocaleDateString('es-AR')} - {event._count?.tickets || 0} entradas
                                    </p>
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="font-semibold text-green-600 dark:text-green-400">
                                    ${new Intl.NumberFormat('es-AR').format(event.accounting.revenue)}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="font-semibold text-red-600 dark:text-red-400">
                                    ${new Intl.NumberFormat('es-AR').format(event.accounting.totalCosts)}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    ${new Intl.NumberFormat('es-AR').format(event.accounting.grossProfit)}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <span className={`font-semibold ${event.accounting.netProfit >= 0 ? 'text-primary' : 'text-red-600 dark:text-red-400'}`}>
                                    ${new Intl.NumberFormat('es-AR').format(event.accounting.netProfit)}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <Badge variant={parseFloat(margin) >= 0 ? 'default' : 'destructive'}>
                                    {margin}%
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comparativa de Rentabilidad por Evento */}
              {topEventsData.length > 0 && (
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="break-words">Rentabilidad por Evento</span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base">
                      Comparativa de ingresos vs ganancia neta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                    <div className="min-w-[500px] h-[400px] sm:h-[450px] md:h-[500px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topEventsData} margin={{ top: 5, right: 30, left: 20, bottom: 80 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={100}
                            tick={{ fontSize: 11 }}
                            interval={0}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 0 }).format(value)}`}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              const formatted = `$${new Intl.NumberFormat('es-AR').format(value)}`;
                              const labels: Record<string, string> = {
                                revenue: 'Ingresos Brutos',
                                netProfit: 'Ganancia Neta',
                              };
                              return [formatted, labels[name] || name];
                            }}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                              border: '1px solid #ccc', 
                              borderRadius: '8px',
                              padding: '10px',
                            }}
                          />
                          <Legend 
                            formatter={(value) => {
                              const labels: Record<string, string> = {
                                revenue: 'Ingresos Brutos',
                                netProfit: 'Ganancia Neta',
                              };
                              return labels[value] || value;
                            }}
                          />
                          <Bar dataKey="revenue" fill="#22c55e" name="revenue" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="netProfit" fill="#8b5cf6" name="netProfit" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Eventos */}
            <TabsContent value="events" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Distribución por categoría - Mejorado */}
                {categoryData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex-shrink-0">
                          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="break-words">Distribución por Categoría</span>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">Eventos agrupados por categoría</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <div className="min-w-[300px] h-[300px] sm:h-[350px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              label={{ fontSize: 12 }}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {categoryData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Distribución por ciudad - Mejorado */}
                {cityData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 dark:bg-green-900/30 flex-shrink-0">
                          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="break-words">Distribución por Ciudad</span>
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">Eventos agrupados por ubicación</CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                      <div className="min-w-[300px] h-[300px] sm:h-[350px] md:h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={cityData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              label={{ fontSize: 12 }}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {cityData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                            ))}
                          </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Lista detallada de eventos - Mejorado */}
              <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="break-words">Eventos Próximos - Detalle Completo</span>
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base">Información detallada de los próximos eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboard?.upcomingEvents?.length > 0 ? (
                      dashboard.upcomingEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="p-4 sm:p-5 rounded-xl border-2 border-border hover:border-secondary/50 hover:bg-gradient-to-r hover:from-secondary/5 hover:to-transparent transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                                <h3 className="font-semibold text-base sm:text-lg break-words">{event.title}</h3>
                                <Badge variant="outline" className="text-xs whitespace-nowrap">{event.category}</Badge>
                                {!event.isPublic && (
                                  <Badge variant="secondary" className="text-xs whitespace-nowrap">Privado</Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mb-2 break-words">
                                {new Date(event.date).toLocaleDateString('es-AR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })} - {event.venue}, {event.city}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Entradas vendidas</p>
                                  <p className="font-semibold">{event._count?.tickets || 0}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tipos de entrada</p>
                                  <p className="font-semibold">{event.ticketTypes?.length || 0}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Estado</p>
                                  <Badge variant={event.isActive ? "default" : "secondary"}>
                                    {event.isActive ? "Activo" : "Inactivo"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-4">
                              Ver detalles →
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No hay eventos próximos</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Análisis Avanzado */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      Análisis de Rendimiento
                    </CardTitle>
                    <CardDescription className="text-base">Métricas clave de rendimiento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border hover:border-secondary/30 transition-colors">
                        <span className="text-sm font-semibold text-muted-foreground">Ticket promedio por evento</span>
                        <span className="text-xl font-bold">{avgTicketsPerEvent.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border hover:border-secondary/30 transition-colors">
                        <span className="text-sm font-semibold text-muted-foreground">Ingreso promedio por evento</span>
                        <span className="text-xl font-bold">
                          ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(avgRevenuePerEvent)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border hover:border-secondary/30 transition-colors">
                        <span className="text-sm font-semibold text-muted-foreground">Tasa de conversión global</span>
                        <span className="text-xl font-bold text-secondary">{conversionRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border hover:border-secondary/30 transition-colors">
                        <span className="text-sm font-semibold text-muted-foreground">Eventos activos</span>
                        <span className="text-xl font-bold">
                          {dashboard?.events?.filter((e: any) => e.isActive).length || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      Resumen de Actividad
                    </CardTitle>
                    <CardDescription className="text-base">Actividad reciente y tendencias</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="p-4 border-l-4 border-secondary rounded-r-xl bg-gradient-to-r from-secondary/5 to-transparent hover:from-secondary/10 transition-colors">
                        <p className="text-sm font-semibold text-muted-foreground">Total de eventos creados</p>
                        <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
                          {dashboard?.stats?.totalEvents || 0}
                        </p>
                      </div>
                      <div className="p-4 border-l-4 border-green-500 rounded-r-xl bg-gradient-to-r from-green-500/5 to-transparent hover:from-green-500/10 transition-colors">
                        <p className="text-sm font-semibold text-muted-foreground">Total de entradas vendidas</p>
                        <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                          {dashboard?.stats?.totalTickets || 0}
                        </p>
                      </div>
                      <div className="p-4 border-l-4 border-blue-500 rounded-r-xl bg-gradient-to-r from-blue-500/5 to-transparent hover:from-blue-500/10 transition-colors">
                        <p className="text-sm font-semibold text-muted-foreground">Total de usuarios</p>
                        <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                          {dashboard?.stats?.totalUsers || 0}
                        </p>
                      </div>
                      <div className="p-4 border-l-4 border-amber-500 rounded-r-xl bg-gradient-to-r from-amber-500/5 to-transparent hover:from-amber-500/10 transition-colors">
                        <p className="text-sm font-semibold text-muted-foreground">Ingresos totales</p>
                        <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-amber-400 bg-clip-text text-transparent">
                          ${new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(Number(dashboard?.stats?.totalRevenue || 0))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Comparativa mensual - Mejorado */}
              {monthlySalesData.length > 0 && (
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <LineChartIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      Comparativa Mensual
                    </CardTitle>
                    <CardDescription className="text-base">Análisis comparativo de ingresos mensuales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlySalesData.map((item: any, index: number) => {
                        const prevAmount = index > 0 ? monthlySalesData[index - 1].amount : item.amount;
                        const change = ((item.amount - prevAmount) / prevAmount) * 100;
                        const isPositive = change >= 0;
                        
                        return (
                          <div key={item.month} className="p-5 border-2 rounded-xl hover:border-secondary/50 transition-all duration-300 bg-gradient-to-br from-card/50 to-card/30">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-base">{item.monthName}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-xl font-bold">
                                  ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(item.amount)}
                                </span>
                                <Badge variant={isPositive ? "default" : "destructive"} className="font-semibold border-2">
                                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 shadow-sm ${isPositive ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                                style={{ 
                                  width: `${Math.min((item.amount / Math.max(...monthlySalesData.map((m: any) => m.amount))) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Metrics;

