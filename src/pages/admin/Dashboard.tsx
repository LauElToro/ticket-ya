import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Ticket, DollarSign, BarChart3, Settings, CheckCircle2, Facebook, ExternalLink, Info, Gift, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminApi.getDashboard(),
  });

  const { data: trackingConfig, isLoading: isLoadingTracking } = useQuery({
    queryKey: ['tracking-config'],
    queryFn: () => adminApi.getTrackingConfig(),
  });

  const { data: eventsData } = useQuery({
    queryKey: ['admin-events-for-gift'],
    queryFn: () => adminApi.getEvents({ isActive: 'true', limit: 100 }),
  });

  const [trackingData, setTrackingData] = useState({
    metaPixelId: trackingConfig?.data?.metaPixelId || '',
    googleAdsId: trackingConfig?.data?.googleAdsId || '',
  });

  const [giftFormData, setGiftFormData] = useState({
    eventId: '',
    ticketTypeId: '',
    quantity: '1',
    recipientEmail: '',
    recipientName: '',
    message: '',
  });

  const [showGiftForm, setShowGiftForm] = useState(false);

  // Actualizar estado cuando se carga la configuración
  useEffect(() => {
    if (trackingConfig?.data) {
      setTrackingData({
        metaPixelId: trackingConfig.data.metaPixelId || '',
        googleAdsId: trackingConfig.data.googleAdsId || '',
      });
    }
  }, [trackingConfig]);

  const updateTrackingMutation = useMutation({
    mutationFn: (data: { metaPixelId?: string; googleAdsId?: string }) => adminApi.updateTrackingConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-config'] });
      toast({
        title: 'Configuración actualizada',
        description: 'La configuración de tracking se ha guardado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    },
  });

  const handleTrackingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTrackingMutation.mutate({
      metaPixelId: trackingData.metaPixelId || undefined,
      googleAdsId: trackingData.googleAdsId || undefined,
    });
  };

  const giftTicketsMutation = useMutation({
    mutationFn: (data: any) => adminApi.giftTicketsByEmail(data),
    onSuccess: (response) => {
      const registrationLink = response.data.registrationLink;
      if (registrationLink) {
        toast({
          title: '✅ Entradas regaladas exitosamente',
          description: (
            <div className="space-y-2">
              <p>{response.data.message}</p>
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold mb-1">Link de registro para el destinatario:</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={registrationLink}
                    readOnly
                    className="h-8 text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(registrationLink);
                      toast({ title: 'Link copiado al portapapeles' });
                    }}
                  >
                    Copiar
                  </Button>
                </div>
              </div>
            </div>
          ),
          duration: 10000,
        });
      } else {
        toast({
          title: '✅ Entradas regaladas exitosamente',
          description: response.data.message,
        });
      }
      setGiftFormData({
        eventId: '',
        ticketTypeId: '',
        quantity: '1',
        recipientEmail: '',
        recipientName: '',
        message: '',
      });
      setShowGiftForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ Error al regalar entradas',
        description: error.message || 'No se pudieron regalar las entradas',
        variant: 'destructive',
      });
    },
  });

  const handleGiftSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftFormData.eventId || !giftFormData.ticketTypeId || !giftFormData.recipientEmail) {
      toast({
        title: 'Error de validación',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }
    giftTicketsMutation.mutate({
      eventId: giftFormData.eventId,
      ticketTypeId: giftFormData.ticketTypeId,
      quantity: parseInt(giftFormData.quantity),
      recipientEmail: giftFormData.recipientEmail,
      recipientName: giftFormData.recipientName || undefined,
      message: giftFormData.message || undefined,
    });
  };

  const selectedEvent = eventsData?.data?.events?.find((e: any) => e.id === giftFormData.eventId);
  const availableTicketTypes = selectedEvent?.ticketTypes || [];

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

          {/* Configuración de Tracking */}
          <Card className="mb-6 sm:mb-8 border-2 shadow-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/20 flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="break-words">Configuración de Tracking</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Configura tus códigos de seguimiento una vez y se aplicarán automáticamente a todos tus eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTrackingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="metaPixelId" className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Facebook className="w-4 h-4" />
                      Meta Pixel ID
                      {trackingData.metaPixelId && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="metaPixelId"
                      value={trackingData.metaPixelId}
                      onChange={(e) => setTrackingData({ ...trackingData, metaPixelId: e.target.value })}
                      placeholder="Ej: 123456789012345"
                      className="h-10"
                      disabled={updateTrackingMutation.isPending || isLoadingTracking}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ID de tu Meta Pixel para tracking de conversiones
                    </p>
                    <a
                      href="https://business.facebook.com/events_manager2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      ¿Cómo obtenerlo?
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <Label htmlFor="googleAdsId" className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4" />
                      Google Ads ID
                      {trackingData.googleAdsId && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="googleAdsId"
                      value={trackingData.googleAdsId}
                      onChange={(e) => setTrackingData({ ...trackingData, googleAdsId: e.target.value })}
                      placeholder="Ej: AW-123456789"
                      className="h-10"
                      disabled={updateTrackingMutation.isPending || isLoadingTracking}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ID de conversión de Google Ads
                    </p>
                    <a
                      href="https://ads.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      ¿Cómo obtenerlo?
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Esta configuración se aplicará automáticamente a todos tus eventos. No necesitas configurarla en cada evento individual.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={updateTrackingMutation.isPending || isLoadingTracking}
                    className="bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary"
                  >
                    {updateTrackingMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Regalar Entradas */}
          <Card className="mb-6 sm:mb-8 border-2 shadow-xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-900/20 flex-shrink-0">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <span className="break-words">Regalar Entradas</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Regala entradas por email. Si el destinatario no está registrado, se creará automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showGiftForm ? (
                <div className="text-center py-8">
                  <Gift className="w-16 h-16 mx-auto mb-4 text-pink-500 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Regala entradas a tus invitados por email
                  </p>
                  <Button
                    onClick={() => setShowGiftForm(true)}
                    className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    Regalar Entradas
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleGiftSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gift-event" className="text-sm font-semibold mb-2 block">
                        Evento *
                      </Label>
                      <select
                        id="gift-event"
                        value={giftFormData.eventId}
                        onChange={(e) => {
                          setGiftFormData({
                            ...giftFormData,
                            eventId: e.target.value,
                            ticketTypeId: '',
                          });
                        }}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                      >
                        <option value="">Seleccionar evento</option>
                        {eventsData?.data?.events?.map((event: any) => (
                          <option key={event.id} value={event.id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="gift-ticket-type" className="text-sm font-semibold mb-2 block">
                        Tipo de Entrada *
                      </Label>
                      <select
                        id="gift-ticket-type"
                        value={giftFormData.ticketTypeId}
                        onChange={(e) => setGiftFormData({ ...giftFormData, ticketTypeId: e.target.value })}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        required
                        disabled={!giftFormData.eventId}
                      >
                        <option value="">Seleccionar tipo de entrada</option>
                        {availableTicketTypes.map((tt: any) => (
                          <option key={tt.id} value={tt.id}>
                            {tt.name} (Disponibles: {tt.availableQty})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="gift-quantity" className="text-sm font-semibold mb-2 block">
                        Cantidad *
                      </Label>
                      <Input
                        id="gift-quantity"
                        type="number"
                        min="1"
                        value={giftFormData.quantity}
                        onChange={(e) => setGiftFormData({ ...giftFormData, quantity: e.target.value })}
                        className="h-10"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="gift-email" className="text-sm font-semibold mb-2 block flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email del Destinatario *
                      </Label>
                      <Input
                        id="gift-email"
                        type="email"
                        value={giftFormData.recipientEmail}
                        onChange={(e) => setGiftFormData({ ...giftFormData, recipientEmail: e.target.value })}
                        placeholder="ejemplo@email.com"
                        className="h-10"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="gift-name" className="text-sm font-semibold mb-2 block">
                        Nombre del Destinatario (opcional)
                      </Label>
                      <Input
                        id="gift-name"
                        type="text"
                        value={giftFormData.recipientName}
                        onChange={(e) => setGiftFormData({ ...giftFormData, recipientName: e.target.value })}
                        placeholder="Nombre completo"
                        className="h-10"
                      />
                    </div>

                    <div>
                      <Label htmlFor="gift-message" className="text-sm font-semibold mb-2 block">
                        Mensaje Personalizado (opcional)
                      </Label>
                      <Textarea
                        id="gift-message"
                        value={giftFormData.message}
                        onChange={(e) => setGiftFormData({ ...giftFormData, message: e.target.value })}
                        placeholder="Mensaje que recibirá el destinatario..."
                        className="min-h-[80px]"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                    <Info className="w-5 h-5 text-pink-600 dark:text-pink-400 flex-shrink-0" />
                    <p className="text-sm text-pink-800 dark:text-pink-200">
                      Si el destinatario no está registrado, se creará una cuenta automáticamente. Una vez registrado, verá sus entradas en "Mis Entradas".
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowGiftForm(false);
                        setGiftFormData({
                          eventId: '',
                          ticketTypeId: '',
                          quantity: '1',
                          recipientEmail: '',
                          recipientName: '',
                          message: '',
                        });
                      }}
                      disabled={giftTicketsMutation.isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={giftTicketsMutation.isPending}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                    >
                      {giftTicketsMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Regalando...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Regalar Entradas
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

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
                  onClick={() => navigate('/admin/tracking')}
                  className="h-auto py-6 sm:py-8 flex flex-col items-center gap-2 sm:gap-3 border-2 hover:border-secondary hover:bg-secondary/5 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  size="lg"
                >
                  <div className="p-2 sm:p-3 rounded-full bg-secondary/10">
                    <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-secondary" />
                  </div>
                  <span className="font-bold text-base sm:text-lg break-words text-center">Tracking</span>
                  <span className="text-xs opacity-70 hidden sm:inline">Meta Pixel & Google Ads</span>
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

