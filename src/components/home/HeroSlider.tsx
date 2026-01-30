import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Loader2 } from 'lucide-react';
import { cn, getEventImageUrl } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { eventsApi } from '@/lib/api';
import { useTheme } from '@/contexts/ThemeContext';

const HeroSlider = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Obtener eventos destacados para el slider
  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['hero-events'],
    queryFn: () => eventsApi.list({ limit: 5 }),
    retry: 1,
    staleTime: 30000,
  });

  const slides = useMemo(() => {
    // Asegurarse de que data sea un array
    const eventsData = Array.isArray(eventsResponse?.data) 
      ? eventsResponse.data 
      : (eventsResponse?.data?.events || []);
    
    if (!eventsData || !Array.isArray(eventsData) || eventsData.length === 0) return [];
    
    return eventsData
      .filter((event: any) => event.isActive && new Date(event.date) >= new Date())
      .slice(0, 5)
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

        const imageUrl = getEventImageUrl(event.image, '1920');

        return {
          id: event.id,
          title: event.title.split(' - ')[0] || event.title,
          subtitle: event.subtitle || event.title.split(' - ').slice(1).join(' - ') || '',
          date: formattedDate,
          location: `${event.venue}, ${event.city}`,
          image: imageUrl,
          price: `Desde $${minPrice.toLocaleString('es-AR')}`,
        };
      });
  }, [eventsResponse]);

  const nextSlide = useCallback(() => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    if (slides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!isAutoPlaying || slides.length === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, slides.length]);

  // Swipe handlers para mobile
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  if (isLoading) {
    return (
      <section className="relative h-[600px] md:h-[700px] overflow-hidden flex items-center justify-center bg-muted">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Cargando eventos destacados...</p>
        </div>
      </section>
    );
  }

  if (error || slides.length === 0) {
    return (
      <section className="relative h-[600px] md:h-[700px] overflow-hidden flex items-center justify-center bg-gradient-to-br from-pulso-black via-pulso-purple/30 to-pulso-black">
        <div className="absolute inset-0 bg-gradient-to-r from-pulso-purple/20 via-transparent to-pulso-magenta/20" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-4 bg-gradient-to-r from-white via-pulso-purple to-pulso-magenta bg-clip-text text-transparent">
            PULSO
          </h1>
          <div className="space-y-2 mb-6 pulso-tagline">
            <p className="text-white/90 text-lg md:text-xl">RITMO DEL CORAZÓN</p>
            <p className="text-white/90 text-lg md:text-xl">ALMA DE LA MÚSICA</p>
          </div>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Una vibrante productora desarrolladora de eventos. Creando experiencias únicas y memorables.
          </p>
          {error && (
            <p className="text-sm text-white/50 mt-4">No se pudieron cargar los eventos destacados</p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section 
      className="relative h-[600px] md:h-[700px] overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ willChange: 'transform' }}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-in-out group',
            index === currentSlide ? 'opacity-100 scale-100 z-20' : 'opacity-0 scale-105 z-10 pointer-events-none'
          )}
          style={{
            pointerEvents: index === currentSlide ? 'auto' : 'none'
          }}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] ease-out group-hover:scale-110"
            style={{ 
              backgroundImage: `url(${slide.image})`,
              imageRendering: 'high-quality',
              willChange: 'transform',
              transformOrigin: 'center center'
            }}
          />
          
          {/* Overlay PULSO - Gradiente púrpura/magenta */}
          {theme === 'light' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-pulso-black/80 via-pulso-purple/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-pulso-black/70 via-transparent to-pulso-purple/40" />
            </>
          )}
          {theme === 'dark' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-pulso-black/90 via-pulso-purple/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-pulso-black/80 via-transparent to-pulso-purple/30" />
            </>
          )}

          {/* Content */}
          <div 
            className="relative h-full container mx-auto px-4 flex items-center z-30"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className={cn(
              'max-w-2xl transition-all duration-700 delay-300 relative z-30',
              theme === 'dark' ? 'text-white' : 'text-card',
              index === currentSlide ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            )}>
              <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-pulso-purple via-pulso-magenta to-pulso-coral text-white text-xs font-semibold rounded-full mb-4 shadow-lg shadow-pulso-purple/30">
                🔥 Evento destacado
              </span>
              <h1 className={cn(
                "text-4xl md:text-6xl font-bold mb-2",
                theme === 'dark' ? 'text-white' : 'text-card'
              )}>{slide.title}</h1>
              <p className={cn(
                "text-xl md:text-2xl mb-6",
                theme === 'dark' ? 'text-white/90' : 'text-card/80'
              )}>{slide.subtitle}</p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className={cn(
                  "flex items-center gap-2",
                  theme === 'dark' ? 'text-white/90' : 'text-card/90'
                )}>
                  <Calendar className="w-5 h-5" />
                  <span>{slide.date}</span>
                </div>
                <div className={cn(
                  "flex items-center gap-2",
                  theme === 'dark' ? 'text-white/90' : 'text-card/90'
                )}>
                  <MapPin className="w-5 h-5" />
                  <span>{slide.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 relative z-40">
                <Button 
                  variant="hero" 
                  size="xl" 
                  className="relative z-40"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    // Usar directamente el slide.id del slide actual
                    const eventId = slide.id;
                    console.log('Click en botón - Slide index:', index, 'Current visible slide:', currentSlide, 'Event ID:', eventId);
                    navigate(`/evento/${eventId}`);
                  }}
                >
                  Comprar ahora
                </Button>
                <span className={cn(
                  "font-medium",
                  theme === 'dark' ? 'text-white/90' : 'text-card/80'
                )}>{slide.price}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Invisible Navigation Areas - Clickeable solo en los bordes extremos */}
      <div
        onClick={prevSlide}
        className="absolute left-0 top-0 bottom-0 w-16 md:w-24 z-10 cursor-pointer"
        aria-label="Slide anterior"
        style={{ pointerEvents: 'auto' }}
      />
      <div
        onClick={nextSlide}
        className="absolute right-0 top-0 bottom-0 w-16 md:w-24 z-10 cursor-pointer"
        aria-label="Slide siguiente"
        style={{ pointerEvents: 'auto' }}
      />

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={cn(
              'w-3 h-3 rounded-full transition-all duration-300',
              index === currentSlide
                ? 'bg-secondary w-8'
                : 'bg-card/50 hover:bg-card/70'
            )}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
