import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Ticket, 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  Mail
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ComoFunciona = () => {
  const steps = [
    {
      icon: Search,
      title: '1. Buscá tu evento',
      description: 'Explorá nuestra amplia variedad de eventos. Filtrá por categoría, ciudad o fecha para encontrar exactamente lo que buscás.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Ticket,
      title: '2. Elegí tus entradas',
      description: 'Seleccioná el tipo de entrada que prefieras y la cantidad. Podés ver todos los detalles del evento antes de comprar.',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      icon: CreditCard,
      title: '3. Pagá de forma segura',
      description: 'Elegí tu método de pago preferido: MercadoPago, transferencia bancaria o efectivo en puntos de pago cercanos.',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: QrCode,
      title: '4. Recibí tus entradas',
      description: 'Tus entradas llegarán por email y también las podés ver en "Mis entradas". Cada entrada tiene un código QR único.',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const features = [
    {
      icon: Smartphone,
      title: 'Acceso desde cualquier dispositivo',
      description: 'Comprá y gestioná tus entradas desde tu celular, tablet o computadora.',
    },
    {
      icon: Shield,
      title: '100% seguro',
      description: 'Tus datos y pagos están protegidos con los más altos estándares de seguridad.',
    },
    {
      icon: Clock,
      title: 'Entradas con vencimiento',
      description: 'Tus entradas tienen 48 días hábiles de validez. Si no las usás, se liberan automáticamente.',
    },
    {
      icon: Users,
      title: 'Transferí tus entradas',
      description: 'Podés transferir tus entradas a otros usuarios registrados mediante QR o email.',
    },
    {
      icon: MapPin,
      title: 'Ubicación en tiempo real',
      description: 'Encontrá fácilmente la ubicación del evento con mapas integrados y direcciones.',
    },
    {
      icon: CheckCircle2,
      title: 'Validación instantánea',
      description: 'Los organizadores pueden validar entradas en tiempo real con escaneo de QR.',
    },
  ];

  const paymentMethods = [
    {
      name: 'MercadoPago',
      description: 'Pago online seguro con MercadoPago. Incluye tarjetas de crédito, débito y dinero en cuenta.',
      icon: '💳',
    },
    {
      name: 'Transferencia bancaria',
      description: 'Transferí desde tu banco usando nuestros datos bancarios.',
      icon: '🏦',
    },
    {
      name: 'Efectivo',
      description: 'Pagá en efectivo en puntos de pago cercanos (Rapipago, Pago Fácil, etc.).',
      icon: '💵',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Cómo funciona Pulso Experiences
            </h1>
            <p className="text-xl text-muted-foreground">
              Comprá entradas para tus eventos favoritos de forma rápida, segura y sencilla
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="glass-card border-2 hover:border-secondary/50 transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className={`w-16 h-16 ${step.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{step.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center mb-16">
            <Link to="/eventos">
              <Button size="lg" variant="hero" className="text-lg px-8 py-6">
                Explorar eventos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-12 bg-muted/30 rounded-3xl mb-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Características principales</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Todo lo que necesitás para disfrutar de los mejores eventos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="glass-card border-2 hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Métodos de pago</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Elegí la forma de pago que más te convenga
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {paymentMethods.map((method, index) => (
              <Card key={index} className="glass-card border-2 text-center hover:border-secondary/50 transition-all">
                <CardHeader>
                  <div className="text-5xl mb-4">{method.icon}</div>
                  <CardTitle className="text-xl">{method.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{method.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="container mx-auto px-4 py-12">
          <Card className="glass-card border-2 max-w-4xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">¿Tenés dudas?</CardTitle>
              <CardDescription className="text-lg">
                Visitá nuestra sección de ayuda para encontrar respuestas a las preguntas más frecuentes
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link to="/ayuda">
                <Button variant="outline" size="lg" className="mt-4">
                  <Mail className="w-5 h-5 mr-2" />
                  Ir a Ayuda
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ComoFunciona;

