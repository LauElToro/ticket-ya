import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  QrCode, 
  Download, 
  Share2, 
  ArrowLeft, 
  Loader2,
  Navigation,
  ExternalLink,
  FileText,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ticketsApi, transferApi } from '@/lib/api';
import { getEventImageUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRScanner } from '@/components/QRScanner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TicketDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Obtener ticket
  const { data: ticketResponse, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getById(id!),
    enabled: !!id,
  });

  // Cargar QR
  const { isLoading: isLoadingQR } = useQuery({
    queryKey: ['ticket-qr', id],
    queryFn: async () => {
      const blob = await ticketsApi.getQR(id!);
      const url = URL.createObjectURL(blob);
      setQrImageUrl(url);
      return blob;
    },
    enabled: !!id && !!ticketResponse?.data,
  });

  const ticket = useMemo(() => {
    if (!ticketResponse?.data) return null;
    return ticketResponse.data;
  }, [ticketResponse]);

  // Transferir entrada por email
  const transferByEmailMutation = useMutation({
    mutationFn: (data: { ticketId: string; toEmail: string; method: 'EMAIL' }) =>
      transferApi.transfer(data),
    onSuccess: () => {
      toast({
        title: '✅ Entrada transferida',
        description: 'La entrada ha sido transferida exitosamente',
      });
      setShowTransferDialog(false);
      setTransferEmail('');
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      navigate('/mis-entradas');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || error.message || 'No se pudo transferir la entrada',
        variant: 'destructive',
      });
    },
  });

  // Transferir entrada por QR personal
  const transferByQRMutation = useMutation({
    mutationFn: (data: { ticketId: string; personalQRCode: string }) =>
      transferApi.transferByQR(data),
    onSuccess: () => {
      toast({
        title: '✅ Entrada transferida',
        description: 'La entrada ha sido transferida exitosamente',
      });
      setShowQRScanner(false);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      navigate('/mis-entradas');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || error.message || 'No se pudo transferir la entrada',
        variant: 'destructive',
      });
    },
  });

  const handleTransferByEmail = () => {
    if (!transferEmail || !ticket) return;
    
    if (!transferEmail.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor ingresa un email válido',
        variant: 'destructive',
      });
      return;
    }

    transferByEmailMutation.mutate({
      ticketId: ticket.id,
      toEmail: transferEmail,
      method: 'EMAIL',
    });
  };

  const handleQRScanSuccess = (scannedQR: string) => {
    if (!ticket) return;
    
    transferByQRMutation.mutate({
      ticketId: ticket.id,
      personalQRCode: scannedQR,
    });
  };

  const handleDownload = async () => {
    if (!id) return;
    try {
      const blob = await ticketsApi.download(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entrada-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: 'Descarga iniciada',
      });
    } catch (error: any) {
      toast({
        title: 'Error al descargar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getGoogleMapsDirections = () => {
    if (!ticket?.event) return null;
    
    const event = ticket.event;
    let url = '';
    
    if (event.address) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.address}, ${event.city}`)}`;
    } else if (event.latitude && event.longitude) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`;
    } else if (event.venue && event.city) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${event.venue}, ${event.city}`)}`;
    }
    
    return url;
  };

  const getStatusBadge = () => {
    if (!ticket) return null;
    
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      ACTIVE: { label: 'Activa', variant: 'default' },
      USED: { label: 'Usada', variant: 'secondary' },
      EXPIRED: { label: 'Expirada', variant: 'destructive' },
      TRANSFERRED: { label: 'Transferida', variant: 'outline' },
      PENDING_PAYMENT: { label: 'Pago pendiente', variant: 'outline' },
    };

    const status = statusMap[ticket.status] || { label: ticket.status, variant: 'outline' as const };
    
    return (
      <Badge variant={status.variant}>
        {status.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando entrada...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-4">Entrada no encontrada</h1>
              <Button onClick={() => navigate('/mis-entradas')}>Volver a mis entradas</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const event = ticket.event;
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const expiresDate = new Date(ticket.expiresAt);
  const formattedExpiresDate = expiresDate.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const imageUrl = getEventImageUrl(event.image, '800');

  const directionsUrl = getGoogleMapsDirections();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate('/mis-entradas')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a mis entradas
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge()}
                        <Badge variant="outline">{event.category}</Badge>
                      </div>
                      <CardTitle className="text-2xl md:text-3xl mb-2">{event.title}</CardTitle>
                      {event.subtitle && (
                        <p className="text-muted-foreground">{event.subtitle}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative h-64 md:h-80 rounded-xl overflow-hidden mb-6">
                    <img
                      src={imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Event Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Calendar className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha del evento</p>
                        <p className="font-semibold">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Clock className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hora</p>
                        <p className="font-semibold">{event.time}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <MapPin className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Lugar</p>
                        <p className="font-semibold">{event.venue}</p>
                        {event.address && (
                          <p className="text-sm text-muted-foreground">{event.address}, {event.city}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de entrada</p>
                        <p className="font-semibold">{ticket.ticketType.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(ticket.ticketType.price).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Vencimiento */}
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Vencimiento de la entrada</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Esta entrada vence el {formattedExpiresDate} (48 días hábiles desde la compra).
                      Si no se usa antes de esa fecha, volverá a estar disponible.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cómo llegar */}
              {directionsUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Navigation className="w-5 h-5 text-secondary" />
                      Cómo llegar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Obtené direcciones desde tu ubicación actual hasta el evento
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(directionsUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir en Google Maps
                      </Button>
                      {event.address && (
                        <div className="w-full h-64 rounded-lg border border-border overflow-hidden">
                          <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            src={`https://www.google.com/maps?q=${encodeURIComponent(`${event.address}, ${event.city}`)}&output=embed`}
                            title="Ubicación del evento"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Factura */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-secondary" />
                    Factura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Número de orden</p>
                        <p className="font-mono font-semibold">{ticket.order.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fecha de compra</p>
                        <p className="font-semibold">
                          {new Date(ticket.purchaseDate).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Método de pago</p>
                        <p className="font-semibold">{ticket.order.paymentMethod}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total pagado</p>
                        <p className="font-semibold text-lg">
                          ${Number(ticket.order.totalAmount).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Comprador</p>
                        <p className="font-semibold">{ticket.owner.name}</p>
                        <p className="text-sm text-muted-foreground">{ticket.owner.email}</p>
                      </div>
                      <Badge variant={ticket.order.paymentStatus === 'COMPLETED' ? 'default' : 'outline'}>
                        {ticket.order.paymentStatus === 'COMPLETED' ? 'Pagado' : ticket.order.paymentStatus}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - QR y Acciones */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-secondary" />
                    Código QR
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* QR Code */}
                  <div className="flex flex-col items-center">
                    {isLoadingQR ? (
                      <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      </div>
                    ) : qrImageUrl ? (
                      <div className="w-64 h-64 p-4 bg-white rounded-lg border-2 border-border">
                        <img
                          src={qrImageUrl}
                          alt="QR Code"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
                        <QrCode className="w-16 h-16 text-muted-foreground" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Mostrá este código QR en la entrada del evento
                    </p>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar entrada
                    </Button>

                    {ticket.status === 'ACTIVE' && (
                      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full">
                            <Send className="w-4 h-4 mr-2" />
                            Transferir entrada
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Transferir entrada</DialogTitle>
                            <DialogDescription>
                              La entrada dejará de ser tuya y pasará a ser propiedad del usuario receptor. 
                              El usuario debe estar registrado en Pulso Experiences.
                            </DialogDescription>
                          </DialogHeader>
                          <Tabs defaultValue="email" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="email">
                                <Mail className="w-4 h-4 mr-2" />
                                Por Email
                              </TabsTrigger>
                              <TabsTrigger value="qr">
                                <QrCode className="w-4 h-4 mr-2" />
                                Por QR
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="email" className="space-y-4 mt-4">
                              <div>
                                <Label htmlFor="transfer-email">Email del destinatario</Label>
                                <Input
                                  id="transfer-email"
                                  type="email"
                                  placeholder="usuario@email.com"
                                  value={transferEmail}
                                  onChange={(e) => setTransferEmail(e.target.value)}
                                  className="mt-2"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                  El usuario debe estar registrado en Pulso Experiences
                                </p>
                              </div>
                              <Button
                                className="w-full"
                                onClick={handleTransferByEmail}
                                disabled={!transferEmail || transferByEmailMutation.isPending}
                              >
                                {transferByEmailMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Transferiendo...
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Transferir por Email
                                  </>
                                )}
                              </Button>
                            </TabsContent>
                            
                            <TabsContent value="qr" className="space-y-4 mt-4">
                              <div className="bg-muted/50 rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                  Escaneá el QR personal del usuario al que querés transferir la entrada.
                                </p>
                                <Button
                                  className="w-full"
                                  onClick={() => {
                                    setShowTransferDialog(false);
                                    setShowQRScanner(true);
                                  }}
                                >
                                  <QrCode className="w-4 h-4 mr-2" />
                                  Escanear QR Personal
                                </Button>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* QR Scanner para transferir */}
                    <QRScanner
                      open={showQRScanner}
                      onClose={() => setShowQRScanner(false)}
                      onScanSuccess={handleQRScanSuccess}
                      onScanError={(error) => {
                        toast({
                          title: 'Error al escanear',
                          description: error,
                          variant: 'destructive',
                        });
                      }}
                      title="Escanear QR Personal"
                      description="Apunta la cámara hacia el QR personal del usuario receptor"
                    />

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: 'Link copiado al portapapeles' });
                      }}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir entrada
                    </Button>
                  </div>

                  {/* Ticket Info */}
                  <div className="pt-4 border-t border-border space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Código de entrada</span>
                      <span className="font-mono text-xs">{ticket.id.substring(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comprada el</span>
                      <span>{new Date(ticket.purchaseDate).toLocaleDateString('es-AR')}</span>
                    </div>
                    {ticket.status === 'ACTIVE' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Entrada válida</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TicketDetalle;

