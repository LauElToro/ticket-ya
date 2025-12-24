import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ticket, DollarSign, CheckCircle, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EventStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['event-stats', id],
    queryFn: async () => {
      if (!id) {
        throw new Error('ID de evento no proporcionado');
      }
      console.log('🔍 Obteniendo estadísticas para evento ID:', id);
      try {
        const response = await adminApi.getEventStats(id);
        console.log('✅ Respuesta recibida:', response);
        if (!response?.data) {
          console.error('❌ Respuesta sin data:', response);
          throw new Error('La respuesta no contiene datos del evento');
        }
        if (!response.data.event) {
          console.error('❌ Evento no encontrado en la respuesta:', response.data);
          throw new Error('Evento no encontrado en la respuesta del servidor');
        }
        return response;
      } catch (err: any) {
        console.error('❌ Error al obtener estadísticas del evento:', err);
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          response: err.response,
        });
        throw err;
      }
    },
    retry: 1,
    enabled: !!id,
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando estadísticas...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !stats || !stats.event) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const is404 = errorMessage.includes('404') || errorMessage.includes('no encontrado') || errorMessage.includes('NOT_FOUND');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => navigate('/admin/events')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Eventos
              </Button>
            </div>
            <Card className="border-2 shadow-lg">
              <CardContent className="pt-12 pb-12 text-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Ticket className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {is404 ? 'No hay evento encontrado' : 'Error al cargar el evento'}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {is404 
                    ? 'El evento que estás buscando no existe o no tienes permisos para verlo.'
                    : `Ocurrió un error: ${errorMessage}`
                  }
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className="text-xs text-muted-foreground mb-4">
                    ID del evento: {id}
                  </p>
                )}
                <Button onClick={() => navigate('/admin/events')} variant="outline">
                  Ver todos los eventos
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const event = stats.event;
  const ticketsSold = stats.ticketsSold || 0;
  const ticketsScanned = stats.ticketsScanned || 0;
  const revenue = Number(stats.revenue) || 0;

  // Obtener precios desde las tandas activas
  const getTicketTypePrice = (ticketTypeId: string) => {
    if (!event?.tandas || event.tandas.length === 0) return 0;
    
    // Buscar en todas las tandas activas
    for (const tanda of event.tandas) {
      if (tanda.tandaTicketTypes) {
        const tandaTicketType = tanda.tandaTicketTypes.find(
          (ttt: any) => ttt.ticketTypeId === ticketTypeId || ttt.ticketType?.id === ticketTypeId
        );
        if (tandaTicketType && tandaTicketType.price) {
          return Number(tandaTicketType.price);
        }
      }
    }
    return 0;
  };

  // Datos para gráficos
  const ticketTypesData = event?.ticketTypes?.map((tt: any) => ({
    name: tt.name.length > 15 ? tt.name.substring(0, 15) + '...' : tt.name,
    vendidas: tt.soldQty || 0,
    disponibles: tt.availableQty || 0,
    price: getTicketTypePrice(tt.id),
  })) || [];

  const salesData = [
    { name: 'Vendidas', value: ticketsSold },
    { name: 'Escaneadas', value: ticketsScanned },
    { name: 'Pendientes', value: ticketsSold - ticketsScanned },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/events')}
              className="hover:bg-secondary/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Button>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-1 h-12 bg-gradient-to-b from-secondary to-primary rounded-full"></div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {event.title}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  {new Date(event.date).toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })} - {event.venue}, {event.city}
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas principales - Mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Entradas Vendidas</CardTitle>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                  <Ticket className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                  {ticketsSold}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  de {event.ticketTypes?.reduce((sum: number, tt: any) => sum + (tt.totalQty || 0), 0) || 0} totales
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Entradas Escaneadas</CardTitle>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                  {ticketsScanned}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {ticketsSold > 0 ? Math.round((ticketsScanned / ticketsSold) * 100) : 0}% de asistencia
                </p>
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
                  ${new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 }).format(revenue)}
                </div>
                <p className="text-xs text-muted-foreground font-medium">Ingresos generados</p>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">Tasa de Conversión</CardTitle>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                  <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                  {event.ticketTypes?.reduce((sum: number, tt: any) => sum + (tt.totalQty || 0), 0) > 0
                    ? Math.round(
                        (ticketsSold /
                          event.ticketTypes.reduce((sum: number, tt: any) => sum + (tt.totalQty || 0), 0)) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground font-medium">Ventas vs Disponibilidad</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de ventas por tipo de entrada */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Tipo de Entrada</CardTitle>
                <CardDescription>Distribución de ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={ticketTypesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="vendidas" fill="#8884d8" name="Vendidas" />
                    <Bar dataKey="disponibles" fill="#82ca9d" name="Disponibles" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de estado de entradas */}
            <Card>
              <CardHeader>
                <CardTitle>Estado de Entradas</CardTitle>
                <CardDescription>Vendidas vs Escaneadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detalle de tipos de entrada */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Tipos de Entrada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event?.ticketTypes?.map((tt: any) => {
                  const sold = tt.soldQty || 0;
                  const total = tt.totalQty || 0;
                  const percentage = total > 0 ? Math.round((sold / total) * 100) : 0;
                  const price = getTicketTypePrice(tt.id);
                  
                  return (
                    <div key={tt.id} className="p-5 border-2 border-border rounded-xl hover:border-secondary/50 transition-all duration-300 bg-gradient-to-br from-card/50 to-card/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-lg">{tt.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {price > 0 ? `$${new Intl.NumberFormat('es-AR').format(price)}` : 'Precio no disponible'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">
                            {sold} / {total}
                          </p>
                          <p className="text-sm text-muted-foreground font-semibold">{percentage}% vendido</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden shadow-inner">
                        <div
                          className="bg-gradient-to-r from-secondary to-secondary/80 h-3 rounded-full transition-all duration-500 shadow-sm"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventStats;

