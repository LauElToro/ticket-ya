import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Ticket, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
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
            <div className="text-center">Cargando...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-300">
      <Header />
      <main className="pt-16 sm:pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Header mejorado */}
          <div className="mb-6 sm:mb-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="w-1 h-8 sm:h-12 bg-gradient-to-b from-secondary to-primary rounded-full flex-shrink-0"></div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent break-words">
                  Dashboard
                </h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base md:text-lg break-words">Vista general y gestión rápida</p>
              </div>
            </div>
          </div>

          {/* Estadísticas principales - ARRIBA DE TODO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                <p className="text-xs text-muted-foreground font-medium">Eventos creados</p>
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
                  <p className="text-xs text-muted-foreground font-medium">Usuarios registrados</p>
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
                <p className="text-xs text-muted-foreground font-medium">Entradas vendidas</p>
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
                <p className="text-xs text-muted-foreground font-medium">Ingresos generados</p>
              </CardContent>
            </Card>
          </div>

          {/* Acciones rápidas - Mejorado */}
          <Card className="mb-6 sm:mb-8 border-2 shadow-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-secondary/20 to-secondary/10 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">⚡</span>
                </div>
                <span className="break-words">Acciones Rápidas</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">Accesos directos a las funciones más utilizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <Button 
                  onClick={() => navigate('/admin/events/new')}
                  className="h-auto py-6 sm:py-8 flex flex-col items-center gap-2 sm:gap-3 bg-gradient-to-br from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <div className="p-2 sm:p-3 rounded-full bg-white/20 backdrop-blur-sm">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                  </div>
                  <span className="font-bold text-base sm:text-lg break-words text-center">Crear Evento</span>
                  <span className="text-xs opacity-90 hidden sm:inline">Nuevo evento</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/events')}
                  className="h-auto py-6 sm:py-8 flex flex-col items-center gap-2 sm:gap-3 border-2 hover:border-secondary hover:bg-secondary/5 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  size="lg"
                >
                  <div className="p-2 sm:p-3 rounded-full bg-secondary/10">
                    <Ticket className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-secondary" />
                  </div>
                  <span className="font-bold text-base sm:text-lg break-words text-center">Ver Eventos</span>
                  <span className="text-xs opacity-70 hidden sm:inline">Gestionar eventos</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/metrics')}
                  className="h-auto py-6 sm:py-8 flex flex-col items-center gap-2 sm:gap-3 border-2 hover:border-secondary hover:bg-secondary/5 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  size="lg"
                >
                  <div className="p-2 sm:p-3 rounded-full bg-secondary/10">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-secondary" />
                  </div>
                  <span className="font-bold text-base sm:text-lg break-words text-center">Ver Métricas</span>
                  <span className="text-xs opacity-70 hidden sm:inline">Análisis detallado</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/users')}
                  className="h-auto py-6 sm:py-8 flex flex-col items-center gap-2 sm:gap-3 border-2 hover:border-secondary hover:bg-secondary/5 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  size="lg"
                >
                  <div className="p-2 sm:p-3 rounded-full bg-secondary/10">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-secondary" />
                  </div>
                  <span className="font-bold text-base sm:text-lg break-words text-center">Usuarios</span>
                  <span className="text-xs opacity-70 hidden sm:inline">Gestionar usuarios</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Eventos próximos - Mejorado */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Eventos Próximos
                </CardTitle>
                <CardDescription className="text-base">Próximos eventos a realizar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard?.upcomingEvents?.length > 0 ? (
                    dashboard.upcomingEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-secondary/50 hover:bg-gradient-to-r hover:from-secondary/5 hover:to-transparent cursor-pointer transition-all duration-300 group"
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-base group-hover:text-secondary transition-colors">{event.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(event.date).toLocaleDateString('es-AR', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-secondary">{event._count?.tickets || 0}</p>
                          <p className="text-xs text-muted-foreground">entradas</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay eventos próximos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top eventos - Mejorado */}
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Ticket className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  Eventos Más Vendidos
                </CardTitle>
                <CardDescription className="text-base">Top 5 eventos por ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboard?.topEvents?.length > 0 ? (
                    dashboard.topEvents.map((event: any, index: number) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-border hover:border-secondary/50 hover:bg-gradient-to-r hover:from-secondary/5 hover:to-transparent cursor-pointer transition-all duration-300 group"
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md ${
                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-gradient-to-br from-secondary to-secondary/80'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-base group-hover:text-secondary transition-colors">{event.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {event._count?.tickets || 0} entradas vendidas
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No hay datos disponibles</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Link a métricas detalladas - Mejorado */}
          <Card className="mb-8 border-2 border-secondary/30 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5 opacity-50"></div>
            <CardContent className="pt-8 pb-8 relative">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur-sm">
                    <span className="text-4xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Métricas Detalladas
                    </h3>
                    <p className="text-base text-muted-foreground">
                      Accedé a análisis completos, gráficos avanzados y estadísticas detalladas de tus eventos
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/admin/metrics')} 
                  size="lg" 
                  className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-6 text-base"
                >
                  Ver Métricas Completas →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

