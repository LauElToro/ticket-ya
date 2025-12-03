import { useLocation, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Mail, Calendar, MapPin, QrCode } from 'lucide-react';

const Confirmacion = () => {
  const location = useLocation();
  const { event, tickets, formData } = location.state || {};

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
            <div className="inline-flex w-20 h-20 rounded-full bg-secondary/20 items-center justify-center mb-4">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              ¡Listo, tu entrada ya es tuya!
            </h1>
            <p className="text-muted-foreground">
              Te enviamos los tickets a <span className="font-medium text-foreground">{buyerData.email}</span>
            </p>
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

          {/* Actions */}
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
