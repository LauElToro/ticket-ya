import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/lib/api';
import { cn, getEventImageUrl } from '@/lib/utils';

const EventImagesCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);

  // Obtener eventos para extraer imágenes
  const { data: eventsResponse } = useQuery({
    queryKey: ['events-carousel'],
    queryFn: () => eventsApi.list({ limit: 50 }),
    retry: 1,
    staleTime: 60000,
  });

  useEffect(() => {
    if (eventsResponse?.data) {
      const eventsData = Array.isArray(eventsResponse.data) 
        ? eventsResponse.data 
        : (eventsResponse.data?.events || []);
      
      const now = new Date();
      const eventImages = eventsData
        .filter((event: any) => {
          if (!event.isActive) return false;
          if (event.date) {
            const eventDate = new Date(event.date);
            return eventDate >= now;
          }
          return true;
        })
        .map((event: any) => getEventImageUrl(event.image, '800'))
        .filter((img: string) => img);
      
      // Duplicar imágenes para efecto infinito
      setImages([...eventImages, ...eventImages, ...eventImages]);
    }
  }, [eventsResponse]);

  useEffect(() => {
    if (!containerRef.current || images.length === 0) return;

    const container = containerRef.current;
    let animationId: number;
    let position = 0;
    const speed = 0.3; // Velocidad de desplazamiento (píxeles por frame) - más lento

    const animate = () => {
      position -= speed;
      
      // Resetear posición cuando se completa un ciclo
      // Cada imagen tiene 300px de ancho
      const imageWidth = 300;
      const totalWidth = images.length * imageWidth;
      const cycleWidth = totalWidth / 3; // Dividir por 3 porque duplicamos las imágenes 3 veces
      
      if (Math.abs(position) >= cycleWidth) {
        position = 0;
      }
      
      container.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [images]);

  if (images.length === 0) return null;

  return (
    <section className="relative w-full h-64 md:h-80 overflow-hidden bg-gradient-to-b from-muted/50 to-background">
      <div className="absolute inset-0">
        <div
          ref={containerRef}
          className="flex h-full will-change-transform"
          style={{ width: `${images.length * 300}px` }}
        >
          {images.map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="flex-shrink-0 w-[300px] h-full relative group"
            >
              <img
                src={image}
                alt={`Evento ${index + 1}`}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                loading="lazy"
                style={{ imageRendering: 'high-quality' }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventImagesCarousel;

