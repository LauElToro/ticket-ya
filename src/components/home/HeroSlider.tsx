import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { eventsApi } from '@/lib/api';

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

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
        const minPrice = event.ticketTypes?.length > 0
          ? Math.min(...event.ticketTypes.map((tt: any) => Number(tt.price)))
          : 0;

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
      <section className="relative h-[600px] md:h-[700px] overflow-hidden flex items-center justify-center bg-gradient-to-r from-primary/20 to-secondary/20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Ticket-Ya</h1>
          <p className="text-xl text-muted-foreground">Tu plataforma de entradas</p>
          {error && (
            <p className="text-sm text-muted-foreground mt-4">No se pudieron cargar los eventos destacados</p>
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
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 transition-all duration-700 ease-in-out',
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          )}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/30" />

          {/* Content */}
          <div className="relative h-full container mx-auto px-4 flex items-center">
            <div className={cn(
              'max-w-2xl text-card transition-all duration-700 delay-300',
              index === currentSlide ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
            )}>
              <span className="inline-block px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full mb-4">
                🔥 Evento destacado
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-2">{slide.title}</h1>
              <p className="text-xl md:text-2xl text-card/80 mb-6">{slide.subtitle}</p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-card/90">
                  <Calendar className="w-5 h-5" />
                  <span>{slide.date}</span>
                </div>
                <div className="flex items-center gap-2 text-card/90">
                  <MapPin className="w-5 h-5" />
                  <span>{slide.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link to={`/evento/${slide.id}`}>
                  <Button variant="hero" size="xl">
                    Comprar ahora
                  </Button>
                </Link>
                <span className="text-card/80 font-medium">{slide.price}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm border border-card/30 flex items-center justify-center text-card hover:bg-card/30 transition-all"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card/20 backdrop-blur-sm border border-card/30 flex items-center justify-center text-card hover:bg-card/30 transition-all"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

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
