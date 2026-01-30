import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, MapPin, QrCode, Download, Clock, CheckCircle, Loader2, ArrowRight, Eye, Share2, AlertCircle, RefreshCw, User, Send, Copy } from 'lucide-react';
import { cn, getEventImageUrl } from '@/lib/utils';
import { ticketsApi, userApi, transferApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';

const MisEntradas = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showPersonalQR, setShowPersonalQR] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [personalQRImage, setPersonalQRImage] = useState<string | null>(null);

  // Obtener tickets del usuario
  const { data: ticketsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['my-tickets', activeTab],
    queryFn: () => ticketsApi.getMyTickets({
      upcoming: activeTab === 'upcoming',
    }),
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // Cache por 30 segundos
  });

  // Obtener QR personal del usuario
  const { data: personalQRData } = useQuery({
    queryKey: ['personal-qr'],
    queryFn: () => userApi.getPersonalQR(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  // Cargar imagen del QR personal
  useQuery({
    queryKey: ['personal-qr-image'],
    queryFn: () => userApi.getPersonalQRImage(),
    enabled: !!user && !!personalQRData?.data?.qrCode,
    staleTime: 5 * 60 * 1000,
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      setPersonalQRImage(url);
    },
  });

  const handleCopyPersonalQR = () => {
    if (personalQRData?.data?.qrCode) {
      navigator.clipboard.writeText(personalQRData.data.qrCode);
      toast({
        title: 'QR copiado',
        description: 'El código QR personal ha sido copiado al portapapeles',
      });
    }
  };

  const handleReceiveQRScan = (scannedQR: string) => {
    // TODO: Implementar recepción de entrada por QR
    // Por ahora, mostrar mensaje informativo
    toast({
      title: 'QR escaneado',
      description: 'Funcionalidad de recepción por QR en desarrollo',
    });
  };

  const tickets = useMemo(() => {
    if (!ticketsResponse?.data || !Array.isArray(ticketsResponse.data)) return [];

    return ticketsResponse.data.map((ticket: any) => {
      const eventDate = new Date(ticket.event.date);
      const formattedDate = eventDate.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      const expiresDate = new Date(ticket.expiresAt);
      const isExpired = expiresDate < new Date();

      const imageUrl = getEventImageUrl(ticket.event.image, '400');

      return {
        id: ticket.id,
        eventTitle: ticket.event.title,
        date: formattedDate,
        time: ticket.event.time || '21:00',
        venue: ticket.event.venue,
        city: ticket.event.city,
        address: ticket.event.address,
        ticketType: ticket.ticketType.name,
        price: Number(ticket.ticketType.price),
        quantity: 1,
        orderNumber: ticket.order?.id || ticket.orderId,
        image: imageUrl,
        qrCode: ticket.qrCode,
        status: ticket.status,
        expiresAt: ticket.expiresAt,
        isExpired,
        event: ticket.event,
      };
    });
  }, [ticketsResponse]);

  const upcomingTickets = useMemo(() => {
    return tickets.filter((ticket: any) => {
      // Incluir tickets activos no expirados y pendientes de pago
      return (ticket.status === 'ACTIVE' && !ticket.isExpired) || ticket.status === 'PENDING_PAYMENT';
    });
  }, [tickets]);

  const pastTickets = useMemo(() => {
    return tickets.filter((ticket: any) => {
      // Incluir tickets usados, expirados, o que ya pasaron su fecha
      return ticket.status === 'USED' || ticket.status === 'EXPIRED' || ticket.isExpired;
    });
  }, [tickets]);

  const displayedTickets = activeTab === 'upcoming' ? upcomingTickets : pastTickets;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Mis entradas</h1>
                <p className="text-muted-foreground">
                  Administrá y descargá tus tickets
                </p>
              </div>
              <div className="flex gap-2">
                <Dialog open={showPersonalQR} onOpenChange={setShowPersonalQR}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <QrCode className="w-4 h-4 mr-2" />
                      Mi QR Personal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                      <DialogTitle>Tu QR Personal</DialogTitle>
                      <DialogDescription>
                        Compartí este QR para que otros usuarios te puedan transferir entradas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {personalQRImage ? (
                        <div className="flex flex-col items-center">
                          <div className="w-64 h-64 p-4 bg-white rounded-lg border-2 border-border">
                            <img
                              src={personalQRImage}
                              alt="QR Personal"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={handleCopyPersonalQR}
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copiar código
                          </Button>
                        </div>
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg mx-auto">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="hero">
                      <Send className="w-4 h-4 mr-2" />
                      Recibir entrada
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Recibir entrada</DialogTitle>
                      <DialogDescription>
                        Escaneá el QR de una entrada que otro usuario te quiera transferir
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Cuando otro usuario escanee tu QR personal o te transfiera una entrada por email, 
                          aparecerá automáticamente en esta sección.
                        </p>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setShowReceiveDialog(false);
                            setShowQRScanner(true);
                          }}
                        >
                          <QrCode className="w-4 h-4 mr-2" />
                          Escanear QR de entrada
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {!user ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Iniciá sesión para ver tus entradas</h3>
              <p className="text-muted-foreground mb-6">
                Necesitás estar logueado para acceder a tus entradas
              </p>
              <Link to="/login">
                <Button variant="hero">Iniciar sesión</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-8">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={cn(
                    'px-6 py-3 rounded-xl font-medium transition-all',
                    activeTab === 'upcoming'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Próximos eventos
                  {upcomingTickets.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                      {upcomingTickets.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={cn(
                    'px-6 py-3 rounded-xl font-medium transition-all',
                    activeTab === 'past'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Eventos pasados
                  {pastTickets.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                      {pastTickets.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Tickets List */}
              {isLoading ? (
                <div className="text-center py-16">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Cargando tus entradas...</p>
                </div>
              ) : error ? (
                <div className="text-center py-16 glass-card rounded-2xl">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Error al cargar tus entradas</h3>
                  <p className="text-muted-foreground mb-6">
                    {error.message || 'No se pudieron cargar tus entradas. Por favor, intentá nuevamente.'}
                  </p>
                  <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reintentar
                  </Button>
                </div>
              ) : displayedTickets.length > 0 ? (
                <div className="space-y-4">
                  {displayedTickets.map((ticket: any, index: number) => {
                    const isExpiringSoon = ticket.expiresAt && new Date(ticket.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                    
                    return (
                      <div
                        key={ticket.id}
                        className="glass-card rounded-2xl overflow-hidden hover-lift animate-fade-up border-2 border-border hover:border-secondary/50 transition-all"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Image */}
                          <div className="md:w-48 h-40 md:h-auto flex-shrink-0 relative">
                            <img
                              src={ticket.image}
                              alt={ticket.eventTitle}
                              className="w-full h-full object-cover"
                            />
                            {ticket.status === 'PENDING_PAYMENT' && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-yellow-500">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pendiente
                                </Badge>
                              </div>
                            )}
                            {ticket.status === 'ACTIVE' && !ticket.isExpired && (
                              <div className="absolute top-2 right-2">
                                <Badge className="bg-green-500">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Activa
                                </Badge>
                              </div>
                            )}
                            {ticket.status === 'USED' && (
                              <div className="absolute top-2 right-2">
                                <Badge variant="secondary">
                                  Usada
                                </Badge>
                              </div>
                            )}
                            {ticket.isExpired && ticket.status !== 'PENDING_PAYMENT' && (
                              <div className="absolute top-2 right-2">
                                <Badge variant="destructive">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Expirada
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-6">
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-2">
                                  <h3 className="text-xl font-bold pr-4">{ticket.eventTitle}</h3>
                                </div>
                                
                                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {ticket.date}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {ticket.time}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {ticket.venue}, {ticket.city}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-4">
                                  <Badge variant="outline" className="font-medium">
                                    {ticket.ticketType}
                                  </Badge>
                                  <Badge variant="secondary">
                                    ${ticket.price.toLocaleString('es-AR')}
                                  </Badge>
                                  {isExpiringSoon && ticket.status === 'ACTIVE' && (
                                    <Badge variant="destructive" className="animate-pulse">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Vence pronto
                                    </Badge>
                                  )}
                                </div>

                                {ticket.expiresAt && ticket.status === 'ACTIVE' && (
                                  <div className="text-xs text-muted-foreground mb-4">
                                    Vence el {new Date(ticket.expiresAt).toLocaleDateString('es-AR')}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex md:flex-col items-center gap-3">
                                {ticket.status === 'PENDING_PAYMENT' && (
                                  <div className="text-center">
                                    <Badge className="bg-yellow-500 mb-2">
                                      <Clock className="w-4 h-4 mr-2" />
                                      Pago pendiente
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      Realizá el pago para activar tu entrada
                                    </p>
                                  </div>
                                )}
                                {ticket.status === 'ACTIVE' && !ticket.isExpired && (
                                  <>
                                    <div className="w-20 h-20 bg-card rounded-xl border-2 border-border flex items-center justify-center">
                                      <QrCode className="w-10 h-10 text-secondary" />
                                    </div>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => navigate(`/entrada/${ticket.id}`)}
                                      className="w-full"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      Ver entrada
                                    </Button>
                                  </>
                                )}
                                {ticket.status === 'USED' && (
                                  <Badge variant="secondary" className="px-4 py-2">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Usada
                                  </Badge>
                                )}
                                {ticket.isExpired && ticket.status !== 'PENDING_PAYMENT' && (
                                  <Badge variant="destructive" className="px-4 py-2">
                                    <AlertCircle className="w-4 h-4 mr-2" />
                                    Expirada
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Order Number & Quick Actions */}
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Orden: <span className="font-mono">{ticket.orderNumber?.substring(0, 12)}...</span>
                                </p>
                                {ticket.status === 'PENDING_PAYMENT' && (
                                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                    ⏰ Tenés 7 días para realizar el pago
                                  </p>
                                )}
                              </div>
                              {(ticket.status === 'ACTIVE' && !ticket.isExpired) || ticket.status === 'PENDING_PAYMENT' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/entrada/${ticket.id}`)}
                                >
                                  {ticket.status === 'PENDING_PAYMENT' ? 'Ver detalles' : 'Ver entrada'}
                                  <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          ) : (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {activeTab === 'upcoming' 
                  ? 'No tenés eventos próximos' 
                  : 'No tenés eventos pasados'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'upcoming'
                  ? 'Explorá nuestro catálogo y encontrá tu próxima experiencia'
                  : 'Acá vas a ver los eventos a los que ya asististe'}
              </p>
              {activeTab === 'upcoming' && (
                <Link to="/eventos">
                  <Button variant="hero">
                    Explorar eventos
                  </Button>
                </Link>
              )}
            </div>
          )}
            </>
          )}

          {/* QR Scanner para recibir entrada */}
          <QRScanner
            open={showQRScanner}
            onClose={() => setShowQRScanner(false)}
            onScanSuccess={handleReceiveQRScan}
            onScanError={(error) => {
              toast({
                title: 'Error al escanear',
                description: error,
                variant: 'destructive',
              });
            }}
            title="Recibir entrada"
            description="Escané el QR de la entrada que querés recibir"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MisEntradas;
