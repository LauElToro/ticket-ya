import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, QrCode, Download, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockTickets = {
  upcoming: [
    {
      id: 1,
      eventTitle: 'Coldplay - Music of the Spheres Tour',
      date: '15 de Marzo, 2025',
      time: '21:00 hs',
      venue: 'Estadio River Plate',
      city: 'Buenos Aires',
      ticketType: 'Campo General',
      quantity: 2,
      orderNumber: 'TKT-12345678',
      image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80',
    },
    {
      id: 2,
      eventTitle: 'Lollapalooza Argentina 2025',
      date: '21-23 de Marzo, 2025',
      time: '12:00 hs',
      venue: 'Hipódromo de San Isidro',
      city: 'Buenos Aires',
      ticketType: 'Abono 3 días',
      quantity: 1,
      orderNumber: 'TKT-87654321',
      image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80',
    },
  ],
  past: [
    {
      id: 3,
      eventTitle: 'Bad Bunny - Most Wanted Tour',
      date: '15 de Noviembre, 2024',
      time: '21:00 hs',
      venue: 'Estadio Único de La Plata',
      city: 'La Plata',
      ticketType: 'Platea Preferencial',
      quantity: 2,
      orderNumber: 'TKT-11223344',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
    },
  ],
};

const MisEntradas = () => {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const tickets = activeTab === 'upcoming' ? mockTickets.upcoming : mockTickets.past;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Mis entradas</h1>
            <p className="text-muted-foreground">
              Administrá y descargá tus tickets
            </p>
          </div>

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
              {mockTickets.upcoming.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-secondary text-secondary-foreground text-xs rounded-full">
                  {mockTickets.upcoming.length}
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
            </button>
          </div>

          {/* Tickets List */}
          {tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="glass-card rounded-2xl overflow-hidden hover-lift animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Image */}
                    <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                      <img
                        src={ticket.image}
                        alt={ticket.eventTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">{ticket.eventTitle}</h3>
                          
                          <div className="space-y-1 text-sm text-muted-foreground">
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

                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-secondary/10 text-secondary text-sm rounded-full font-medium">
                              {ticket.ticketType}
                            </span>
                            <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                              {ticket.quantity} {ticket.quantity === 1 ? 'entrada' : 'entradas'}
                            </span>
                          </div>
                        </div>

                        {/* QR & Actions */}
                        <div className="flex md:flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-card rounded-xl border border-border flex items-center justify-center">
                            <QrCode className="w-12 h-12 text-foreground" />
                          </div>
                          
                          {activeTab === 'upcoming' && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Descargar
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Order Number */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Orden: <span className="font-mono">{ticket.orderNumber}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MisEntradas;
