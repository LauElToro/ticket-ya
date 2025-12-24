import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import EventCard, { EventCardProps } from './EventCard';
import { eventsApi } from '@/lib/api';
import { Loader2, Sparkles } from 'lucide-react';

const FeaturedEvents = () => {
  // Obtener eventos activos y próximos
  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['featured-events'],
    queryFn: () => eventsApi.list({ limit: 6 }),
    retry: 1,
    staleTime: 30000,
  });

  const featuredEvents: EventCardProps[] = useMemo(() => {
    // Asegurarse de que data sea un array
    const eventsData = Array.isArray(eventsResponse?.data) 
      ? eventsResponse.data 
      : (eventsResponse?.data?.events || []);
    
    if (!eventsData || !Array.isArray(eventsData) || eventsData.length === 0) return [];
    
    return eventsData
      .filter((event: any) => event.isActive && new Date(event.date) >= new Date())
      .slice(0, 6)
      .map((event: any) => {
        // Obtener el precio mínimo desde las tandas activas
        let minPrice = 0;
        if (event.tandas && event.tandas.length > 0) {
          const prices: number[] = [];
          const now = new Date();
          
          // Buscar en todas las tandas activas
          event.tandas.forEach((tanda: any) => {
            if (!tanda.isActive) return;
            
            // Verificar si la tanda está activa según fechas
            const startDate = tanda.startDate ? new Date(tanda.startDate) : null;
            const endDate = tanda.endDate ? new Date(tanda.endDate) : null;
            let isTandaActive = true;
            
            if (startDate && endDate) {
              isTandaActive = now >= startDate && now <= endDate;
            } else if (startDate) {
              isTandaActive = now >= startDate;
            } else if (endDate) {
              isTandaActive = now <= endDate;
            }
            
            if (isTandaActive && tanda.tandaTicketTypes && Array.isArray(tanda.tandaTicketTypes)) {
              tanda.tandaTicketTypes.forEach((ttt: any) => {
                if (ttt.price !== undefined && ttt.price !== null) {
                  const price = Number(ttt.price);
                  if (!isNaN(price) && price > 0) {
                    prices.push(price);
                  }
                }
              });
            }
          });
          
          // Si no hay precios en tandas activas, buscar en todas las tandas
          if (prices.length === 0) {
            event.tandas.forEach((tanda: any) => {
              if (tanda.isActive && tanda.tandaTicketTypes && Array.isArray(tanda.tandaTicketTypes)) {
                tanda.tandaTicketTypes.forEach((ttt: any) => {
                  if (ttt.price !== undefined && ttt.price !== null) {
                    const price = Number(ttt.price);
                    if (!isNaN(price) && price > 0) {
                      prices.push(price);
                    }
                  }
                });
              }
            });
          }
          
          minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        }

        const eventDate = new Date(event.date);
        const formattedDate = eventDate.toLocaleDateString('es-AR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

        const imageUrl = event.image
          ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}${event.image}`
          : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80';

        // Calcular entradas disponibles
        let totalAvailable = 0;
        let totalTickets = 0;
        if (event.tandas && event.tandas.length > 0) {
          event.tandas.forEach((tanda: any) => {
            if (tanda.isActive && tanda.tandaTicketTypes && Array.isArray(tanda.tandaTicketTypes)) {
              tanda.tandaTicketTypes.forEach((ttt: any) => {
                if (ttt.availableQty !== undefined && ttt.availableQty !== null) {
                  totalAvailable += Number(ttt.availableQty);
                }
                if (ttt.quantity !== undefined && ttt.quantity !== null) {
                  totalTickets += Number(ttt.quantity);
                }
              });
            }
          });
        }

        return {
          id: event.id,
          title: event.title,
          image: imageUrl,
          date: formattedDate,
          time: event.time || undefined,
          venue: event.venue,
          city: event.city,
          price: minPrice,
          category: event.category,
          rawDate: eventDate,
          availableTickets: totalAvailable > 0 ? totalAvailable : undefined,
          totalTickets: totalTickets > 0 ? totalTickets : undefined,
        };
      });
  }, [eventsResponse]);

  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Eventos destacados
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            No te pierdas los eventos más esperados del momento. Comprá tus entradas antes de que se agoten.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando eventos destacados...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No se pudieron cargar los eventos destacados</p>
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {featuredEvents.map((event, index) => (
              <div 
                key={event.id} 
                className="animate-fade-up h-full"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <EventCard {...event} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Aún no hay eventos destacados</h3>
            <p className="text-muted-foreground">
              Los eventos destacados aparecerán aquí cuando estén disponibles
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedEvents;
