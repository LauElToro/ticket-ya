import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, Share2, Heart, Minus, Plus, ShieldCheck, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const eventData = {
  id: 1,
  title: 'Coldplay - Music of the Spheres Tour',
  subtitle: 'Una experiencia musical única e inolvidable',
  image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=80',
  date: '15 de Marzo, 2025',
  time: '21:00 hs',
  venue: 'Estadio River Plate',
  address: 'Av. Figueroa Alcorta 7597',
  city: 'Buenos Aires',
  category: 'Música',
  organizer: 'DF Entertainment',
  description: `
    Coldplay regresa a Argentina con su espectacular gira "Music of the Spheres World Tour". 
    Una experiencia audiovisual única que combina la música de su último álbum con efectos visuales 
    impresionantes, pulseras LED sincronizadas y una puesta en escena que ha sido aclamada en todo el mundo.

    El show incluirá todos los clásicos de la banda como "Yellow", "The Scientist", "Fix You", 
    "Viva la Vida" y "Paradise", junto con los nuevos éxitos de "Music of the Spheres".
  `,
  tickets: [
    { id: 1, name: 'Campo General', price: 45000, available: 500 },
    { id: 2, name: 'Campo VIP', price: 75000, available: 200 },
    { id: 3, name: 'Platea Preferencial', price: 95000, available: 150 },
    { id: 4, name: 'Platea Alta', price: 35000, available: 800 },
  ],
  faq: [
    { question: '¿Cuál es la edad mínima?', answer: 'El evento es apto para todas las edades. Menores de 10 años deben ingresar con un adulto responsable.' },
    { question: '¿Se puede entrar con comida?', answer: 'No se permite el ingreso con comida ni bebidas. Habrá puestos de venta dentro del estadio.' },
    { question: '¿Hay estacionamiento?', answer: 'Sí, el estadio cuenta con estacionamiento pago limitado. Recomendamos llegar temprano.' },
  ],
};

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTickets, setSelectedTickets] = useState<Record<number, number>>({});
  const [isFavorite, setIsFavorite] = useState(false);

  const updateQuantity = (ticketId: number, delta: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const newValue = Math.max(0, Math.min(10, current + delta));
      if (newValue === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketId]: newValue };
    });
  };

  const totalAmount = Object.entries(selectedTickets).reduce((total, [ticketId, qty]) => {
    const ticket = eventData.tickets.find((t) => t.id === Number(ticketId));
    return total + (ticket?.price || 0) * qty;
  }, 0);

  const totalTickets = Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  const handleBuy = () => {
    if (totalTickets === 0) {
      toast({
        title: 'Seleccioná al menos una entrada',
        variant: 'destructive',
      });
      return;
    }
    navigate('/checkout', { state: { event: eventData, tickets: selectedTickets } });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: eventData.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copiado al portapapeles' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Banner */}
        <div className="relative h-[400px] md:h-[500px]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${eventData.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-sm font-semibold rounded-full mb-4">
                {eventData.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{eventData.title}</h1>
              <p className="text-muted-foreground text-lg">{eventData.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Info */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha</p>
                      <p className="font-medium">{eventData.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Hora</p>
                      <p className="font-medium">{eventData.time}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lugar</p>
                      <p className="font-medium">{eventData.venue}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Organizador</p>
                      <p className="font-medium">{eventData.organizer}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {eventData.address}, {eventData.city}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4">Sobre el evento</h2>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {eventData.description}
                </p>
              </div>

              {/* FAQ */}
              <div className="glass-card rounded-2xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-secondary" />
                  Preguntas frecuentes
                </h2>
                <div className="space-y-4">
                  {eventData.faq.map((item, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-0">
                      <h3 className="font-medium mb-1">{item.question}</h3>
                      <p className="text-sm text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Ticket Selection */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 sticky top-24 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Entradas</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={isFavorite ? 'text-destructive' : ''}
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleShare}>
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {eventData.tickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-4 rounded-xl border border-border bg-muted/30 hover:border-secondary/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{ticket.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {ticket.available} disponibles
                          </p>
                        </div>
                        <p className="font-bold text-lg">
                          ${ticket.price.toLocaleString('es-AR')}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(ticket.id, -1)}
                          disabled={!selectedTickets[ticket.id]}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {selectedTickets[ticket.id] || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(ticket.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total & Buy Button */}
                <div className="pt-4 border-t border-border space-y-4">
                  {totalTickets > 0 && (
                    <div className="flex justify-between text-lg">
                      <span className="text-muted-foreground">
                        Total ({totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'})
                      </span>
                      <span className="font-bold">${totalAmount.toLocaleString('es-AR')}</span>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={handleBuy}
                    disabled={totalTickets === 0}
                  >
                    {totalTickets > 0 ? 'Comprar entradas' : 'Seleccioná tus entradas'}
                  </Button>

                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-secondary" />
                    Compra 100% segura
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

export default EventoDetalle;
