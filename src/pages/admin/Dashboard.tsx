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
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Gestión y estadísticas de eventos</p>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.stats?.totalEvents || 0}</div>
                <p className="text-xs text-muted-foreground">Eventos creados</p>
              </CardContent>
            </Card>

            {dashboard?.stats?.totalUsers !== undefined && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Usuarios registrados</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboard?.stats?.totalTickets || 0}</div>
                <p className="text-xs text-muted-foreground">Entradas vendidas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${new Intl.NumberFormat('es-AR').format(Number(dashboard?.stats?.totalRevenue || 0))}
                </div>
                <p className="text-xs text-muted-foreground">Ingresos generados</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Eventos próximos */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos Próximos</CardTitle>
                <CardDescription>Próximos eventos a realizar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.upcomingEvents?.length > 0 ? (
                    dashboard.upcomingEvents.map((event: any) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                      >
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{event._count?.tickets || 0} entradas</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No hay eventos próximos</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top eventos */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos Más Vendidos</CardTitle>
                <CardDescription>Top 5 eventos por ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboard?.topEvents?.length > 0 ? (
                    dashboard.topEvents.map((event: any, index: number) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/admin/events/${event.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {event._count?.tickets || 0} entradas vendidas
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No hay datos disponibles</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de ventas por mes */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Mes</CardTitle>
                <CardDescription>Últimos 6 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboard?.monthlySales || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `$${new Intl.NumberFormat('es-AR').format(value)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Ingresos" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de distribución de eventos */}
            <Card>
              <CardHeader>
                <CardTitle>Top Eventos</CardTitle>
                <CardDescription>Por cantidad de entradas vendidas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard?.topEvents?.slice(0, 5) || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="_count.tickets" fill="#8884d8" name="Entradas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de ventas por mes */}
            {dashboard?.monthlySales && dashboard.monthlySales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Mes</CardTitle>
                  <CardDescription>Últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboard.monthlySales}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value) => {
                          const date = new Date(value + '-01');
                          return date.toLocaleDateString('es-AR', { month: 'short' });
                        }}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `$${new Intl.NumberFormat('es-AR').format(value)}`}
                        labelFormatter={(label) => {
                          const date = new Date(label + '-01');
                          return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Ingresos" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de top eventos */}
            {dashboard?.topEvents && dashboard.topEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Eventos</CardTitle>
                  <CardDescription>Por cantidad de entradas vendidas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={dashboard.topEvents.slice(0, 5).map((event: any) => ({
                        title: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
                        tickets: event._count?.tickets || 0,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="tickets" fill="#8884d8" name="Entradas Vendidas" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button onClick={() => navigate('/admin/events/new')}>
                  Crear Nuevo Evento
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/events')}>
                  Ver Todos los Eventos
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/users')}>
                  Gestionar Usuarios
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

