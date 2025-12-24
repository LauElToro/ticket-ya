import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Ticket, DollarSign, TrendingUp, BarChart3, LineChart as LineChartIcon, Activity, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe', '#ff00ff'];

const Metrics = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const dashboard = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
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

  // Preparar datos para gráficos
  const monthlySalesData = dashboard?.monthlySales?.map((item: any) => ({
    ...item,
    monthName: new Date(item.month + '-01').toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }),
  })) || [];

  const topEventsData = dashboard?.topEvents?.slice(0, 10).map((event: any) => ({
    name: event.title.length > 25 ? event.title.substring(0, 25) + '...' : event.title,
    tickets: event._count?.tickets || 0,
    revenue: event.revenue || 0,
    fullTitle: event.title,
  })) || [];

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header mejorado */}
          <div className="mb-10">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/dashboard')}
              className="mb-6 hover:bg-secondary/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-12 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10">
                    <BarChart3 className="w-8 h-8 text-secondary" />
                  </div>
                  Métricas Detalladas
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Análisis completo y estadísticas avanzadas de tu plataforma</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            {/* Tab: Resumen General */}
            <TabsContent value="overview" className="space-y-6">
              {/* KPIs Principales - Mejorados */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de ventas por mes - Área - Mejorado */}
                {monthlySalesData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                          <LineChartIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        Evolución de Ingresos
                      </CardTitle>
                      <CardDescription className="text-base">Últimos 6 meses - Tendencias de ventas</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={monthlySalesData}>
                          <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="monthName"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            tickFormatter={(value) => `$${new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(value)}`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${new Intl.NumberFormat('es-AR').format(value)}`, 'Ingresos']}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#8884d8" 
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                            name="Ingresos"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Top eventos por ingresos - Mejorado */}
                {topEventsData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <DollarSign className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        Top Eventos por Ingresos
                      </CardTitle>
                      <CardDescription className="text-base">Los 10 eventos con mayor recaudación</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={topEventsData.slice(0, 10)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" tickFormatter={(value) => `$${new Intl.NumberFormat('es-AR', { notation: 'compact' }).format(value)}`} />
                          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                          <Tooltip 
                            formatter={(value: number) => `$${new Intl.NumberFormat('es-AR').format(value)}`}
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                          />
                          <Bar dataKey="revenue" fill="#82ca9d" name="Ingresos" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Top eventos por ventas - Mejorado */}
              {topEventsData.length > 0 && (
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                        <Ticket className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      Top Eventos por Ventas
                    </CardTitle>
                    <CardDescription className="text-base">Los 10 eventos con más entradas vendidas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={topEventsData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45} 
                          textAnchor="end" 
                          height={120}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="tickets" fill="#8884d8" name="Entradas Vendidas" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="revenue" fill="#82ca9d" name="Ingresos (AR$)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Eventos */}
            <TabsContent value="events" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por categoría - Mejorado */}
                {categoryData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Distribución por Categoría
                      </CardTitle>
                      <CardDescription className="text-base">Eventos agrupados por categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
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
                    </CardContent>
                  </Card>
                )}

                {/* Distribución por ciudad - Mejorado */}
                {cityData.length > 0 && (
                  <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        Distribución por Ciudad
                      </CardTitle>
                      <CardDescription className="text-base">Eventos agrupados por ubicación</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={cityData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
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
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Lista detallada de eventos - Mejorado */}
              <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    Eventos Próximos - Detalle Completo
                  </CardTitle>
                  <CardDescription className="text-base">Información detallada de los próximos eventos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {dashboard?.upcomingEvents?.length > 0 ? (
                      dashboard.upcomingEvents.map((event: any) => (
                        <div
                          key={event.id}
                          className="p-5 rounded-xl border-2 border-border hover:border-secondary/50 hover:bg-gradient-to-r hover:from-secondary/5 hover:to-transparent transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md"
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{event.title}</h3>
                                <Badge variant="outline">{event.category}</Badge>
                                {!event.isPublic && (
                                  <Badge variant="secondary">Privado</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {new Date(event.date).toLocaleDateString('es-AR', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })} - {event.venue}, {event.city}
                              </p>
                              <div className="grid grid-cols-3 gap-4 mt-3">
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

