import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, Share2, Heart, Minus, Plus, ShieldCheck, Info, Loader2, ExternalLink, Navigation, Ticket as TicketIcon, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { eventsApi } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [isFavorite, setIsFavorite] = useState(false);

  // Obtener evento de la API
  const { data: eventResponse, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
    retry: 1,
  });

  const eventData = useMemo(() => {
    if (!eventResponse?.data) return null;

    const event = eventResponse.data;
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const imageUrl = event.image
      ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}${event.image}`
      : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=80';

    return {
      id: event.id,
      title: event.title,
      subtitle: event.subtitle || '',
      image: imageUrl,
      date: formattedDate,
      time: event.time || '21:00',
      venue: event.venue,
      address: event.address || '',
      city: event.city,
      category: event.category,
      organizer: event.organizer?.name || 'Organizador',
      description: event.description || '',
      latitude: (event as any).latitude,
      longitude: (event as any).longitude,
      tickets: event.ticketTypes?.map((tt: any) => ({
        id: String(tt.id),
        name: tt.name,
        price: Number(tt.price),
        available: tt.availableQty,
      })) || [],
    };
  }, [eventResponse]);

  const updateQuantity = (ticketId: string, delta: number) => {
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

  const totalAmount = useMemo(() => {
    if (!eventData) return 0;
    return Object.entries(selectedTickets).reduce((total, [ticketId, qty]) => {
      const ticket = eventData.tickets.find((t) => t.id === ticketId);
      return total + (ticket?.price || 0) * qty;
    }, 0);
  }, [selectedTickets, eventData]);

  const totalTickets = useMemo(() => {
    return Object.values(selectedTickets).reduce((a, b) => a + b, 0);
  }, [selectedTickets]);

  const handleBuy = () => {
    if (!eventData) return;
    
    if (totalTickets === 0) {
      toast({
        title: 'Seleccioná al menos una entrada',
        variant: 'destructive',
      });
      return;
    }
    navigate('/checkout', { state: { event: eventData, tickets: selectedTickets } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando evento...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16">
              <h1 className="text-2xl font-bold mb-4">
                {error ? 'Error al cargar el evento' : 'Evento no encontrado'}
              </h1>
              <p className="text-muted-foreground mb-6">
                {error ? 'No se pudo cargar la información del evento' : 'El evento que buscas no existe'}
              </p>
              <Button onClick={() => navigate('/eventos')}>Volver a eventos</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: eventData.title,
        text: `¡No te pierdas ${eventData.title}!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copiado al portapapeles' });
    }
  };

  const getGoogleMapsUrl = () => {
    if (eventData.address) {
      const encodedAddress = encodeURIComponent(`${eventData.address}, ${eventData.city}`);
      return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
    } else if (eventData.latitude && eventData.longitude) {
      return `https://www.google.com/maps?q=${eventData.latitude},${eventData.longitude}&output=embed`;
    } else if (eventData.venue && eventData.city) {
      const encodedVenue = encodeURIComponent(`${eventData.venue}, ${eventData.city}`);
      return `https://www.google.com/maps?q=${encodedVenue}&output=embed`;
    }
    return null;
  };

  const openGoogleMaps = () => {
    let url = '';
    if (eventData.address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${eventData.address}, ${eventData.city}`)}`;
    } else if (eventData.latitude && eventData.longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${eventData.latitude},${eventData.longitude}`;
    } else if (eventData.venue && eventData.city) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${eventData.venue}, ${eventData.city}`)}`;
    }
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Banner */}
        <div className="relative h-[450px] md:h-[550px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url(${eventData.image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="container mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="px-4 py-1.5 bg-secondary text-secondary-foreground text-sm font-semibold">
                  {eventData.category}
                </Badge>
                {eventData.tickets.length > 0 && (
                  <Badge variant="outline" className="px-4 py-1.5">
                    <TicketIcon className="w-3 h-3 mr-1.5" />
                    {eventData.tickets.reduce((sum, t) => sum + t.available, 0)} entradas disponibles
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 drop-shadow-lg">{eventData.title}</h1>
              {eventData.subtitle && (
                <p className="text-lg md:text-xl text-foreground/90 mb-4 drop-shadow-md">{eventData.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm md:text-base">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span className="font-medium">{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-secondary" />
                  <span className="font-medium">{eventData.time}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <span className="font-medium">{eventData.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-5 hover-lift transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha</p>
                      <p className="font-semibold text-lg">{eventData.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5 hover-lift transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Clock className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hora</p>
                      <p className="font-semibold text-lg">{eventData.time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5 hover-lift transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lugar</p>
                      <p className="font-semibold text-lg">{eventData.venue}</p>
                      {eventData.address && (
                        <p className="text-sm text-muted-foreground mt-1">{eventData.address}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5 hover-lift transition-all">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Organizador</p>
                      <p className="font-semibold text-lg">{eventData.organizer}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {eventData.description && (
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-secondary" />
                    <h2 className="text-xl md:text-2xl font-semibold">Sobre el evento</h2>
                  </div>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-base md:text-lg">
                    {eventData.description}
                  </p>
                </div>
              )}

              {/* Google Maps */}
              {getGoogleMapsUrl() && (
                <div className="glass-card rounded-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-secondary" />
                      <h2 className="text-xl md:text-2xl font-semibold">Ubicación</h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openGoogleMaps}
                      className="gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir en Maps
                    </Button>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {eventData.address && `${eventData.address}, `}{eventData.city}
                    </p>
                    {eventData.venue && (
                      <p className="text-sm font-medium">{eventData.venue}</p>
                    )}
                  </div>
                  <div className="w-full h-[400px] md:h-[450px] rounded-xl border-2 border-border overflow-hidden shadow-lg">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={getGoogleMapsUrl()!}
                      title="Ubicación del evento"
                      className="w-full h-full"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <Navigation className="w-3 h-3" />
                    <span>Hacé clic en "Abrir en Maps" para obtener direcciones</span>
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar - Ticket Selection */}
            <div className="lg:col-span-1">
              <div className="glass-card rounded-2xl p-6 sticky top-24 space-y-6 shadow-xl">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <TicketIcon className="w-5 h-5 text-secondary" />
                    <h2 className="text-xl font-semibold">Entradas</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setIsFavorite(!isFavorite);
                        toast({
                          title: isFavorite ? 'Removido de favoritos' : 'Agregado a favoritos',
                        });
                      }}
                      className={isFavorite ? 'text-destructive hover:text-destructive' : ''}
                      title={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
                    >
                      <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-current scale-110' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={handleShare}
                      title="Compartir evento"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {eventData.tickets.length > 0 ? (
                    eventData.tickets.map((ticket, index) => (
                      <div
                        key={ticket.id}
                        className="p-4 rounded-xl border-2 border-border bg-gradient-to-br from-muted/50 to-background hover:border-secondary/50 transition-all hover:shadow-md"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{ticket.name}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {ticket.available} disponibles
                              </Badge>
                              {ticket.available < 10 && ticket.available > 0 && (
                                <Badge variant="destructive" className="text-xs animate-pulse">
                                  ¡Últimas!
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-3">
                            <p className="font-bold text-xl text-secondary">
                              ${ticket.price.toLocaleString('es-AR')}
                            </p>
                            <p className="text-xs text-muted-foreground">ARS</p>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Cantidad</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-full"
                              onClick={() => updateQuantity(String(ticket.id), -1)}
                              disabled={!selectedTickets[String(ticket.id)] || ticket.available === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 text-center font-semibold text-lg">
                              {selectedTickets[String(ticket.id)] || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-full"
                              onClick={() => updateQuantity(String(ticket.id), 1)}
                              disabled={ticket.available === 0 || (selectedTickets[String(ticket.id)] || 0) >= ticket.available}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <TicketIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground font-medium">No hay tipos de entrada disponibles</p>
                      <p className="text-sm text-muted-foreground mt-1">Las entradas se agotaron</p>
                    </div>
                  )}
                </div>

                {/* Total & Buy Button */}
                <div className="pt-4 border-t border-border space-y-4">
                  {totalTickets > 0 && (
                    <div className="bg-secondary/10 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'}
                        </span>
                        <span className="font-bold text-xl text-secondary">
                          ${totalAmount.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-2xl">${totalAmount.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  )}

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={handleBuy}
                    disabled={totalTickets === 0}
                  >
                    {totalTickets > 0 ? (
                      <>
                        <TicketIcon className="w-5 h-5 mr-2" />
                        Comprar entradas
                      </>
                    ) : (
                      'Seleccioná tus entradas'
                    )}
                  </Button>

                  <div className="flex flex-col items-center gap-2 pt-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ShieldCheck className="w-4 h-4 text-secondary" />
                      Compra 100% segura
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>✓ Pago seguro</span>
                      <span>✓ Entradas garantizadas</span>
                    </div>
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
