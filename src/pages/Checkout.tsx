import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Wallet, Banknote, Building2, Check, ArrowLeft, Loader2, MapPin, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { paymentPlacesApi, ordersApi, paymentApi, api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTrackEvent } from '@/components/TrackingScripts';

const paymentMethods = [
  { id: 'mercadopago', name: 'MercadoPago', icon: Wallet, description: 'Hasta 12 cuotas sin interés' },
  { id: 'cash', name: 'Efectivo', icon: Banknote, description: 'Rapipago, Pago Fácil' },
  { id: 'transfer', name: 'Transferencia', icon: Building2, description: 'Home banking' },
];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('mercadopago');
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dni: user?.dni || '',
    phone: user?.phone || '',
  });

  // Pre-llenar formulario cuando el usuario se carga
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dni: user.dni || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Obtener datos del estado de navegación
  const eventData = location.state?.event;
  const selectedTickets = location.state?.tickets || {};
  const refCode = location.state?.refCode; // Código de referido
  const { trackInitiateCheckout, trackPurchase } = useTrackEvent();

  // Calcular totalAmount antes de cualquier uso
  const totalAmount = useMemo(() => {
    if (!eventData || !selectedTickets || Object.keys(selectedTickets).length === 0) {
      return 0;
    }
    return Object.entries(selectedTickets).reduce((total, [ticketId, qty]) => {
      const ticket = eventData.tickets?.find((t: any) => String(t.id) === String(ticketId));
      return total + (ticket?.price || 0) * (qty as number);
    }, 0);
  }, [eventData, selectedTickets]);

  // Obtener evento completo para tracking
  const { data: fullEventData } = useQuery({
    queryKey: ['event', eventData?.id],
    queryFn: () => {
      if (!eventData?.id) return null;
      return fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/api/events/${eventData.id}`)
        .then(res => res.json())
        .then(data => data.data);
    },
    enabled: !!eventData?.id,
  });

  // Trackear inicio de checkout
  useEffect(() => {
    if (fullEventData && totalAmount > 0) {
      trackInitiateCheckout(fullEventData.metaPixelId, totalAmount, 'ARS');
    }
  }, [fullEventData, totalAmount, trackInitiateCheckout]);

  // Si no hay datos, redirigir a eventos
  if (!eventData || !selectedTickets || Object.keys(selectedTickets).length === 0) {
    navigate('/eventos');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.dni || !formData.phone) {
        toast({ title: 'Completá todos los campos', variant: 'destructive' });
        return;
      }
    }
    setStep(step + 1);
  };

  // Obtener lugares de pago si es efectivo
  const { data: paymentPlacesData } = useQuery({
    queryKey: ['payment-places', eventData?.city, eventData?.address],
    queryFn: () => paymentPlacesApi.getNearbyPlaces({
      city: eventData?.city || '',
      address: eventData?.address,
      latitude: eventData?.latitude ? parseFloat(eventData.latitude) : undefined,
      longitude: eventData?.longitude ? parseFloat(eventData.longitude) : undefined,
    }),
    enabled: selectedPayment === 'cash' && !!eventData?.city,
  });

  // Obtener datos bancarios si es efectivo
  const { data: bankAccountData } = useQuery({
    queryKey: ['bank-account'],
    queryFn: () => paymentPlacesApi.getBankAccountInfo(),
    enabled: selectedPayment === 'cash',
  });

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: 'Debes iniciar sesión',
        description: 'Necesitas estar logueado para realizar una compra',
        variant: 'destructive',
      });
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Verificar que el token existe
    const token = localStorage.getItem('token');
    if (!token) {
      toast({
        title: 'Sesión expirada',
        description: 'Por favor, iniciá sesión nuevamente',
        variant: 'destructive',
      });
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Preparar datos de tickets
      const ticketsData = Object.entries(selectedTickets).map(([ticketId, quantity]) => ({
        ticketTypeId: ticketId,
        quantity: quantity as number,
      }));

      // Mapear método de pago del frontend al backend
      const paymentMethodMap: Record<string, string> = {
        'mercadopago': 'MERCADOPAGO',
        'cash': 'CASH',
        'transfer': 'BANK_TRANSFER',
      };

      const backendPaymentMethod = paymentMethodMap[selectedPayment] || 'MERCADOPAGO';

      // Asegurar que el token esté actualizado en el cliente API
      api.setToken(token);

      // Crear la orden
      const orderResponse = await ordersApi.create({
        eventId: eventData.id,
        tickets: ticketsData,
        paymentMethod: backendPaymentMethod,
        referidoId: refCode || undefined, // Pasar el código de referido si existe
      });

      // Si es MercadoPago, crear preferencia y redirigir
      if (selectedPayment === 'mercadopago') {
        try {
          // Construir items para MercadoPago
          const items = ticketsData.map((ticket: any) => {
            const ticketType = eventData.tickets.find((t: any) => String(t.id) === ticket.ticketTypeId);
            return {
              title: `${ticketType?.name || 'Entrada'} - ${eventData.title}`,
              quantity: ticket.quantity,
              unit_price: ticketType?.price || 0,
            };
          });

          // Crear preferencia de MercadoPago
          const preferenceResponse = await paymentApi.createMercadoPagoPreference({
            orderId: orderResponse.data.id,
            payerEmail: formData.email || user?.email || '',
            payerName: formData.name || user?.name || '',
            payerDni: formData.dni || user?.dni || '',
            tickets: ticketsData, // Enviar datos de tickets
          });

          setIsProcessing(false);

          // Redirigir a MercadoPago
          const initPoint = preferenceResponse.data.sandbox_init_point || preferenceResponse.data.init_point;
          if (initPoint) {
            window.location.href = initPoint;
          } else {
            throw new Error('No se pudo obtener la URL de pago de MercadoPago');
          }
        } catch (error: any) {
          setIsProcessing(false);
          toast({
            title: 'Error al crear el pago',
            description: error.message || 'No se pudo crear la preferencia de MercadoPago',
            variant: 'destructive',
          });
          return;
        }
      } else {
        // Para otros métodos de pago, redirigir a confirmación
        setIsProcessing(false);
        
        // Trackear compra completada
        if (fullEventData) {
          trackPurchase(fullEventData.metaPixelId, fullEventData.googleAdsId, totalAmount, 'ARS');
        }
        
        navigate('/confirmacion', { 
          state: { 
            event: eventData, 
            tickets: selectedTickets, 
            formData,
            paymentMethod: selectedPayment,
            paymentPlaces: paymentPlacesData?.data,
            bankAccount: bankAccountData?.data,
            order: orderResponse.data,
            fullEvent: fullEventData, // Pasar evento completo para tracking
          } 
        });
      }
    } catch (error: any) {
      setIsProcessing(false);
      
      // Si es error de autenticación, redirigir a login
      if (error.message?.includes('401') || error.message?.includes('Token') || error.message?.includes('autenticación')) {
        toast({
          title: 'Sesión expirada',
          description: 'Por favor, iniciá sesión nuevamente',
          variant: 'destructive',
        });
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }

      toast({
        title: 'Error al procesar el pago',
        description: error.message || 'Ocurrió un error al crear la orden',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copiado`,
      description: 'Se copió al portapapeles',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step > 1 ? 'Volver' : 'Volver al evento'}
          </Button>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                    step >= s
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-16 md:w-24 h-1 mx-2 rounded-full transition-all',
                      step > s ? 'bg-secondary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Step 1: Personal Data */}
              {step === 1 && (
                <div className="glass-card rounded-2xl p-6 animate-fade-up">
                  <h2 className="text-xl font-semibold mb-6">Datos personales</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="name">Nombre completo</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Juan Pérez"
                        className="mt-1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="juan@email.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dni">DNI</Label>
                      <Input
                        id="dni"
                        name="dni"
                        value={formData.dni}
                        onChange={handleInputChange}
                        placeholder="12345678"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="11 1234-5678"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full mt-6"
                    onClick={handleNextStep}
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="glass-card rounded-2xl p-6 animate-fade-up">
                    <h2 className="text-xl font-semibold mb-6">Método de pago</h2>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPayment(method.id)}
                            className={cn(
                              'w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                              selectedPayment === method.id
                                ? 'border-secondary bg-secondary/5'
                                : 'border-border hover:border-secondary/50'
                            )}
                          >
                            <div className={cn(
                              'w-12 h-12 rounded-lg flex items-center justify-center',
                              selectedPayment === method.id ? 'bg-secondary/20' : 'bg-muted'
                            )}>
                              <Icon className={cn(
                                'w-6 h-6',
                                selectedPayment === method.id ? 'text-secondary' : 'text-muted-foreground'
                              )} />
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-medium">{method.name}</p>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                            </div>
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                              selectedPayment === method.id ? 'border-secondary' : 'border-muted-foreground'
                            )}>
                              {selectedPayment === method.id && (
                                <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Información de pago en efectivo */}
                  {selectedPayment === 'cash' && (
                    <div className="glass-card rounded-2xl p-6 animate-fade-up border-2 border-secondary/20">
                      <div className="flex items-center gap-2 mb-4">
                        <Banknote className="w-5 h-5 text-secondary" />
                        <h3 className="text-lg font-semibold">Información de pago en efectivo</h3>
                      </div>
                      
                      {/* Datos bancarios */}
                      {bankAccountData?.data && (
                        <Card className="mb-4">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Datos para el pago</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Banco:</span>
                                <span className="font-medium">{bankAccountData.data.bankName}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Titular:</span>
                                <span className="font-medium">{bankAccountData.data.accountHolder}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">CBU:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs">{bankAccountData.data.cbu}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(bankAccountData.data.cbu, 'CBU')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Alias:</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-semibold">{bankAccountData.data.alias}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(bankAccountData.data.alias, 'Alias')}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">CUIT:</span>
                                <span className="font-mono text-xs">{bankAccountData.data.cuit}</span>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                <strong>Importante:</strong> Una vez realizado el pago, tu entrada quedará en estado "Pendiente" hasta que se confirme el pago. Tenés 7 días para realizar el pago.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Lugares de pago cercanos */}
                      {paymentPlacesData?.data && paymentPlacesData.data.length > 0 && (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Lugares de pago cercanos
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {paymentPlacesData.data.slice(0, 5).map((place: any, index: number) => (
                                <div
                                  key={index}
                                  className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
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
                                      {place.openingHours && (
                                        <p className="text-xs text-muted-foreground mt-1">{place.openingHours}</p>
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
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleNextStep}
                  >
                    Continuar
                  </Button>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="glass-card rounded-2xl p-6 animate-fade-up">
                  <h2 className="text-xl font-semibold mb-6">Confirmar compra</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50">
                      <h3 className="font-medium mb-2">Datos del comprador</h3>
                      <p className="text-sm text-muted-foreground">{formData.name}</p>
                      <p className="text-sm text-muted-foreground">{formData.email}</p>
                      <p className="text-sm text-muted-foreground">DNI: {formData.dni}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50">
                      <h3 className="font-medium mb-2">Método de pago</h3>
                      <p className="text-sm text-muted-foreground">
                        {paymentMethods.find((m) => m.id === selectedPayment)?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-6 p-4 rounded-xl bg-secondary/10 text-secondary">
                    <ShieldCheck className="w-5 h-5" />
                    <p className="text-sm">Tu compra está protegida por nuestra garantía de seguridad</p>
                  </div>

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full mt-6"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      `Pagar $${totalAmount.toLocaleString('es-AR')}`
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 sticky top-24">
                <h3 className="font-semibold mb-4">Resumen de compra</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      <img
                        src={eventData.image || 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200&q=80'}
                        alt={eventData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm line-clamp-2">{eventData.title}</p>
                      <p className="text-xs text-muted-foreground">{eventData.date}</p>
                      <p className="text-xs text-muted-foreground">{eventData.venue}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  {Object.entries(selectedTickets).map(([ticketId, qty]) => {
                    const ticket = eventData.tickets?.find((t: any) => String(t.id) === String(ticketId));
                    return (
                      <div key={ticketId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {ticket?.name || 'Entrada'} x{qty as number}
                        </span>
                        <span>${((ticket?.price || 0) * (qty as number)).toLocaleString('es-AR')}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${totalAmount.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
