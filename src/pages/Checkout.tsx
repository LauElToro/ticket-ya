import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, CreditCard, Wallet, Banknote, Building2, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const paymentMethods = [
  { id: 'mercadopago', name: 'MercadoPago', icon: Wallet, description: 'Hasta 12 cuotas sin interés' },
  { id: 'credit', name: 'Tarjeta de crédito', icon: CreditCard, description: 'Hasta 6 cuotas' },
  { id: 'debit', name: 'Tarjeta de débito', icon: CreditCard, description: 'Débito inmediato' },
  { id: 'cash', name: 'Efectivo', icon: Banknote, description: 'Rapipago, Pago Fácil' },
  { id: 'transfer', name: 'Transferencia', icon: Building2, description: 'Home banking' },
];

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('mercadopago');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dni: '',
    phone: '',
  });

  // Mock data if no state passed
  const eventData = location.state?.event || {
    title: 'Coldplay - Music of the Spheres Tour',
    date: '15 de Marzo, 2025',
    venue: 'Estadio River Plate',
    tickets: [
      { id: 1, name: 'Campo General', price: 45000 },
    ],
  };

  const selectedTickets = location.state?.tickets || { 1: 2 };
  
  const totalAmount = Object.entries(selectedTickets).reduce((total, [ticketId, qty]) => {
    const ticket = eventData.tickets?.find((t: any) => t.id === Number(ticketId));
    return total + (ticket?.price || 45000) * (qty as number);
  }, 0);

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

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    navigate('/confirmacion', { state: { event: eventData, tickets: selectedTickets, formData } });
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
                        src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=200&q=80"
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
                    const ticket = eventData.tickets?.find((t: any) => t.id === Number(ticketId));
                    return (
                      <div key={ticketId} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {ticket?.name || 'Entrada'} x{qty as number}
                        </span>
                        <span>${((ticket?.price || 45000) * (qty as number)).toLocaleString('es-AR')}</span>
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
