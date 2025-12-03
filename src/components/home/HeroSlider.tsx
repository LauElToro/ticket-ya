import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const slides = [
  {
    id: 1,
    title: 'Coldplay',
    subtitle: 'Music of the Spheres World Tour',
    date: '15 de Marzo, 2025',
    location: 'Estadio River Plate, Buenos Aires',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1920&q=80',
    price: 'Desde $45.000',
  },
  {
    id: 2,
    title: 'Lollapalooza Argentina',
    subtitle: 'El festival más grande de Latinoamérica',
    date: '21-23 de Marzo, 2025',
    location: 'Hipódromo de San Isidro',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920&q=80',
    price: 'Desde $85.000',
  },
  {
    id: 3,
    title: 'Bad Bunny',
    subtitle: 'Most Wanted Tour',
    date: '28 de Abril, 2025',
    location: 'Estadio Único de La Plata',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80',
    price: 'Desde $55.000',
  },
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

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
