import { useLocation, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Download, Mail, Calendar, MapPin, QrCode, AlertCircle, Banknote, Copy, ExternalLink, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Confirmacion = () => {
  const location = useLocation();
  const { event, tickets, formData, paymentMethod, paymentPlaces, bankAccount } = location.state || {};
  
  const isCashPayment = paymentMethod === 'cash';

  const eventData = event || {
    title: 'Coldplay - Music of the Spheres Tour',
    date: '15 de Marzo, 2025',
    venue: 'Estadio River Plate',
    city: 'Buenos Aires',
  };

  const buyerData = formData || {
    name: 'Usuario',
    email: 'usuario@email.com',
  };

  const ticketCount = tickets 
    ? Object.values(tickets).reduce((a: number, b) => a + (b as number), 0) 
    : 2;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success Animation */}
          <div className="text-center mb-8 animate-scale-in">
            <div className={`inline-flex w-20 h-20 rounded-full ${isCashPayment ? 'bg-yellow-500/20' : 'bg-secondary/20'} items-center justify-center mb-4`}>
              {isCashPayment ? (
                <AlertCircle className="w-10 h-10 text-yellow-600" />
              ) : (
                <CheckCircle className="w-10 h-10 text-secondary" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {isCashPayment ? '¡Reserva realizada!' : '¡Listo, tu entrada ya es tuya!'}
            </h1>
            <p className="text-muted-foreground">
              {isCashPayment ? (
                <>
                  Tu entrada quedó reservada. Tenés <strong>7 días</strong> para realizar el pago en efectivo.
                </>
              ) : (
                <>
                  Te enviamos los tickets a <span className="font-medium text-foreground">{buyerData.email}</span>
                </>
              )}
            </p>
            {isCashPayment && (
              <Badge variant="outline" className="mt-3">
                <Clock className="w-3 h-3 mr-1" />
                Pago pendiente
              </Badge>
            )}
          </div>

          {/* Event Summary */}
          <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-up">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200&q=80"
                  alt={eventData.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-bold text-lg">{eventData.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4" />
                  {eventData.date}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {eventData.venue}, {eventData.city}
                </div>
              </div>
            </div>

            {/* Tickets */}
            <div className="space-y-4">
              {Array.from({ length: ticketCount as number }).map((_, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-dashed border-secondary/50 bg-secondary/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Entrada #{index + 1}</p>
                      <p className="text-sm text-muted-foreground">Campo General</p>
                    </div>
                    <div className="w-16 h-16 bg-card rounded-lg flex items-center justify-center border border-border">
                      <QrCode className="w-10 h-10 text-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Información de pago en efectivo */}
          {isCashPayment && (
            <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-up border-2 border-yellow-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Banknote className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">Instrucciones de pago</h3>
              </div>
              
              {/* Datos bancarios */}
              {bankAccount && (
                <Card className="mb-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Datos para el pago</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Banco:</span>
                        <span className="font-medium">{bankAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Titular:</span>
                        <span className="font-medium">{bankAccount.accountHolder}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">CBU:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{bankAccount.cbu}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(bankAccount.cbu);
                              toast({ title: 'CBU copiado' });
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Alias:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold">{bankAccount.alias}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => {
                              navigator.clipboard.writeText(bankAccount.alias);
                              toast({ title: 'Alias copiado' });
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">CUIT:</span>
                        <span className="font-mono text-xs">{bankAccount.cuit}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lugares de pago */}
              {paymentPlaces && paymentPlaces.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Lugares de pago cercanos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {paymentPlaces.slice(0, 3).map((place: any, index: number) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{place.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {place.type === 'RAPIPAGO' ? 'Rapipago' : place.type === 'PAGO_FACIL' ? 'Pago Fácil' : 'Banco'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{place.address}, {place.city}</p>
                              {place.distance && (
                                <p className="text-xs text-muted-foreground mt-1">Aprox. {place.distance}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.address}, ${place.city}`)}`;
                                window.open(url, '_blank');
                              }}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Recordá:</strong> Una vez realizado el pago, tu entrada quedará activa. Tenés 7 días para realizar el pago, después la reserva se cancelará automáticamente.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          {!isCashPayment && (
            <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-up stagger-2">
              <Button variant="hero" size="lg" className="flex-1">
                <Download className="w-5 h-5 mr-2" />
                Descargar tickets (PDF)
              </Button>
              <Button variant="outline" size="lg" className="flex-1">
                <Mail className="w-5 h-5 mr-2" />
                Reenviar al email
              </Button>
            </div>
          )}

          {/* Order Info */}
          <div className="glass-card rounded-2xl p-6 animate-fade-up stagger-3">
            <h3 className="font-semibold mb-4">Detalles de la compra</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número de orden</span>
                <span className="font-mono">#TKT-{Date.now().toString().slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comprador</span>
                <span>{buyerData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de compra</span>
                <span>{new Date().toLocaleDateString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link to="/">
              <Button variant="ghost">
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Confirmacion;
