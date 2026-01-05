import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, Share2, Heart, Minus, Plus, ShieldCheck, Info, Loader2, ExternalLink, Navigation, Ticket as TicketIcon, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { eventsApi, favoriteApi } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TrackingScripts, useTrackEvent } from '@/components/TrackingScripts';

const EventoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const refCode = searchParams.get('ref'); // Código de referido
  const privateLink = searchParams.get('link'); // Link privado para eventos privados

  // Obtener evento de la API
  const { data: eventResponse, isLoading, error } = useQuery({
    queryKey: ['event', id, privateLink],
    queryFn: () => eventsApi.getById(id!, privateLink || undefined),
    enabled: !!id,
    retry: 1,
  });

  // Verificar si está en favoritos
  const { data: favoriteCheck } = useQuery({
    queryKey: ['favorite-check', id],
    queryFn: () => favoriteApi.checkFavorite(id!),
    enabled: !!id && !!user,
  });

  const isFavorite = favoriteCheck?.data?.isFavorite || false;

  // Mutaciones para agregar/remover favoritos
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        return favoriteApi.remove(id!);
      } else {
        return favoriteApi.add(id!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-check', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      toast({
        title: isFavorite ? 'Removido de favoritos' : 'Agregado a favoritos',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'No se pudo actualizar favoritos',
        variant: 'destructive',
      });
    },
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

    // Obtener la tanda activa (la que está en el rango de fechas actual)
    const now = new Date();
    let activeTanda = event.tandas?.find((tanda: any) => {
      if (!tanda.isActive) return false;
      const startDate = tanda.startDate ? new Date(tanda.startDate) : null;
      const endDate = tanda.endDate ? new Date(tanda.endDate) : null;
      
      if (startDate && endDate) {
        return now >= startDate && now <= endDate;
      } else if (startDate) {
        return now >= startDate;
      } else if (endDate) {
        return now <= endDate;
      }
      // Si no tiene fechas, considerar activa si isActive es true
      return true;
    });
    
    // Si no hay tanda activa, usar la primera tanda activa o la primera disponible
    if (!activeTanda) {
      activeTanda = event.tandas?.find((t: any) => t.isActive) || event.tandas?.[0];
    }

    // Mapear tipos de entrada con precios desde la tanda activa
    const tickets = event.ticketTypes?.map((tt: any) => {
      // Buscar el precio en la tanda activa
      let price = 0;
      if (activeTanda?.tandaTicketTypes && Array.isArray(activeTanda.tandaTicketTypes)) {
        const tandaTicketType = activeTanda.tandaTicketTypes.find((ttt: any) => {
          // Intentar coincidir por ticketTypeId o por el objeto ticketType
          return ttt.ticketTypeId === tt.id || 
                 ttt.ticketType?.id === tt.id ||
                 ttt.ticketTypeId === String(tt.id) ||
                 String(ttt.ticketTypeId) === String(tt.id);
        });
        if (tandaTicketType && tandaTicketType.price !== undefined && tandaTicketType.price !== null) {
          price = Number(tandaTicketType.price);
          if (isNaN(price)) price = 0;
        }
      }

      return {
        id: String(tt.id),
        name: tt.name,
        price: price,
        available: tt.availableQty || 0,
      };
    }) || [];

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
      tickets: tickets,
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

  const { trackViewContent } = useTrackEvent();
  const event = eventResponse?.data;

  // Trackear visualización del contenido
  useEffect(() => {
    if (event && event.metaPixelId) {
      trackViewContent(event.metaPixelId, event.title, event.category);
    }
  }, [event?.id, event?.metaPixelId, event?.title, event?.category, trackViewContent]);

  const handleBuy = () => {
    if (!eventData) return;
    
    if (totalTickets === 0) {
      toast({
        title: 'Seleccioná al menos una entrada',
        variant: 'destructive',
      });
      return;
    }
    navigate('/checkout', { state: { event: eventData, tickets: selectedTickets, refCode } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background transition-colors duration-300">
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
      <div className="min-h-screen bg-background transition-colors duration-300">
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
    if (eventData?.address) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${eventData.address}, ${eventData.city}`)}`;
    } else if (eventData?.latitude && eventData?.longitude) {
      url = `https://www.google.com/maps/search/?api=1&query=${eventData.latitude},${eventData.longitude}`;
    } else if (eventData?.venue && eventData?.city) {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${eventData.venue}, ${eventData.city}`)}`;
    }
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TrackingScripts
        metaPixelId={event?.metaPixelId}
        googleAdsId={event?.googleAdsId}
        eventName="ViewContent"
      />
      <Header />
      
      <main className="pt-16">
        {/* Hero Banner */}
        <div className="relative h-[400px] sm:h-[450px] md:h-[550px] overflow-hidden group" style={{ willChange: 'transform' }}>
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-out group-hover:scale-110"
            style={{ 
              backgroundImage: `url(${eventData.image})`,
              imageRendering: 'high-quality',
              willChange: 'transform',
              transformOrigin: 'center center'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-12">
            <div className="container mx-auto max-w-full overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Badge className="px-3 sm:px-4 py-1 sm:py-1.5 bg-secondary text-secondary-foreground text-xs sm:text-sm font-semibold whitespace-nowrap">
                  {eventData.category}
                </Badge>
                {eventData.tickets.length > 0 && (
                  <Badge variant="outline" className="px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
                    <TicketIcon className="w-3 h-3 mr-1 sm:mr-1.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{eventData.tickets.reduce((sum, t) => sum + t.available, 0)} entradas disponibles</span>
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-3 drop-shadow-lg break-words">{eventData.title}</h1>
              {eventData.subtitle && (
                <p className="text-base sm:text-lg md:text-xl text-foreground/90 mb-3 sm:mb-4 drop-shadow-md break-words">{eventData.subtitle}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm md:text-base">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{eventData.date}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                  <span className="font-medium whitespace-nowrap">{eventData.time}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full flex-shrink-0">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-secondary flex-shrink-0" />
                  <span className="font-medium break-words">{eventData.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-full overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 min-w-0 overflow-hidden">
              {/* Event Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card rounded-xl p-4 sm:p-5 hover-lift transition-all overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
                      <Calendar className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Fecha</p>
                      <p className="font-semibold text-base sm:text-lg break-words">{eventData.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-4 sm:p-5 hover-lift transition-all overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
                      <Clock className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Hora</p>
                      <p className="font-semibold text-base sm:text-lg break-words">{eventData.time}</p>
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-4 sm:p-5 hover-lift transition-all overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
                      <MapPin className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Lugar</p>
                      <p className="font-semibold text-base sm:text-lg break-words">{eventData.venue}</p>
                      {eventData.address && (
                        <p className="text-sm text-muted-foreground mt-1 break-words">{eventData.address}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-4 sm:p-5 hover-lift transition-all overflow-hidden">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/10 rounded-lg flex-shrink-0">
                      <Users className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Organizador</p>
                      <p className="font-semibold text-base sm:text-lg break-words">{eventData.organizer}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {eventData.description && (
                <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-secondary flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold break-words">Sobre el evento</h2>
                  </div>
                  <Separator className="mb-4" />
                  <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-sm sm:text-base md:text-lg break-words">
                    {eventData.description}
                  </p>
                </div>
              )}

              {/* Google Maps */}
              {getGoogleMapsUrl() && (
                <div className="glass-card rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <MapPin className="w-5 h-5 text-secondary flex-shrink-0" />
                      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold truncate">Ubicación</h2>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openGoogleMaps}
                      className="gap-2 flex-shrink-0 w-full sm:w-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="hidden sm:inline">Abrir en Maps</span>
                      <span className="sm:hidden">Abrir Maps</span>
                    </Button>
                  </div>
                  <Separator className="mb-4" />
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-muted-foreground flex items-center gap-2 break-words">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{eventData.address && `${eventData.address}, `}{eventData.city}</span>
                    </p>
                    {eventData.venue && (
                      <p className="text-sm font-medium break-words">{eventData.venue}</p>
                    )}
                  </div>
                  <div className="w-full h-[300px] sm:h-[400px] md:h-[450px] rounded-xl border-2 border-border overflow-hidden shadow-lg relative">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={getGoogleMapsUrl()!}
                      title="Ubicación del evento"
                      className="w-full h-full absolute inset-0"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <Navigation className="w-3 h-3 flex-shrink-0" />
                    <span className="break-words">Hacé clic en "Abrir en Maps" para obtener direcciones</span>
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar - Ticket Selection */}
            <div className="lg:col-span-1 order-first lg:order-last">
              <div className="glass-card rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24 space-y-6 shadow-xl max-w-full overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-border gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <TicketIcon className="w-5 h-5 text-secondary flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl font-semibold truncate">Entradas</h2>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {user && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavoriteMutation.mutate()}
                        disabled={toggleFavoriteMutation.isPending}
                        className={isFavorite ? 'text-destructive hover:text-destructive' : ''}
                        title={isFavorite ? 'Remover de favoritos' : 'Agregar a favoritos'}
                      >
                        {toggleFavoriteMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Heart className={`w-5 h-5 transition-all ${isFavorite ? 'fill-current scale-110' : ''}`} />
                        )}
                      </Button>
                    )}
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

                <div className="space-y-3 overflow-hidden">
                  {eventData.tickets.length > 0 ? (
                    eventData.tickets.map((ticket, index) => (
                      <div
                        key={ticket.id}
                        className="p-4 sm:p-5 rounded-xl border-2 border-border bg-gradient-to-br from-muted/50 to-background hover:border-secondary/50 transition-all hover:shadow-md"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base mb-2">{ticket.name}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-xs whitespace-nowrap">
                                {ticket.available} disponibles
                              </Badge>
                              {ticket.available < 10 && ticket.available > 0 && (
                                <Badge variant="destructive" className="text-xs animate-pulse whitespace-nowrap">
                                  ¡Últimas!
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0 sm:ml-3">
                            <p className="font-bold text-xl sm:text-2xl text-secondary break-words">
                              ${ticket.price.toLocaleString('es-AR')}
                            </p>
                            <p className="text-xs text-muted-foreground">ARS</p>
                          </div>
                        </div>
                        
                        <Separator className="my-3" />
                        
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-muted-foreground whitespace-nowrap">Cantidad</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
                              onClick={() => updateQuantity(String(ticket.id), -1)}
                              disabled={!selectedTickets[String(ticket.id)] || ticket.available === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-10 sm:w-12 text-center font-semibold text-lg sm:text-xl">
                              {selectedTickets[String(ticket.id)] || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full flex-shrink-0"
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
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {totalTickets} {totalTickets === 1 ? 'entrada' : 'entradas'}
                        </span>
                        <span className="font-bold text-lg sm:text-xl text-secondary break-words text-right">
                          ${totalAmount.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold whitespace-nowrap">Total</span>
                        <span className="font-bold text-xl sm:text-2xl break-words text-right">${totalAmount.toLocaleString('es-AR')}</span>
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
