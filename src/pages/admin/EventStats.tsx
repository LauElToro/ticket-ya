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

  const { data, isLoading } = useQuery({
    queryKey: ['event-stats', id],
    queryFn: () => adminApi.getEventStats(id!),
  });

  const stats = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">Cargando estadísticas...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center">Evento no encontrado</div>
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

  // Datos para gráficos
  const ticketTypesData = event?.ticketTypes?.map((tt: any) => ({
    name: tt.name.length > 15 ? tt.name.substring(0, 15) + '...' : tt.name,
    vendidas: tt.soldQty || 0,
    disponibles: tt.availableQty || 0,
  })) || [];

  const salesData = [
    { name: 'Vendidas', value: ticketsSold },
    { name: 'Escaneadas', value: ticketsScanned },
    { name: 'Pendientes', value: ticketsSold - ticketsScanned },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => navigate('/admin/events')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Button>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event?.title}</h1>
            <p className="text-muted-foreground">
              {new Date(event?.date).toLocaleDateString('es-AR')} - {event?.venue}, {event?.city}
            </p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas Vendidas</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketsSold}</div>
                <p className="text-xs text-muted-foreground">
                  de {event?.ticketTypes?.reduce((sum: number, tt: any) => sum + (tt.totalQty || 0), 0) || 0} totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entradas Escaneadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketsScanned}</div>
                <p className="text-xs text-muted-foreground">
                  {ticketsSold > 0 ? Math.round((ticketsScanned / ticketsSold) * 100) : 0}% de asistencia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${new Intl.NumberFormat('es-AR').format(revenue)}
                </div>
                <p className="text-xs text-muted-foreground">Ingresos generados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {event?.ticketTypes?.reduce((sum: number, tt: any) => sum + (tt.totalQty || 0), 0) > 0
                    ? Math.round(
                        (ticketsSold /
                          event.ticketTypes.reduce((sum: number, tt: any) => sum + (tt.totalQty || 0), 0)) *
                          100
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Ventas vs Disponibilidad</p>
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
                  
                  return (
                    <div key={tt.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{tt.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${new Intl.NumberFormat('es-AR').format(Number(tt.price))}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {sold} / {total}
                          </p>
                          <p className="text-sm text-muted-foreground">{percentage}% vendido</p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-secondary h-2 rounded-full transition-all"
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

