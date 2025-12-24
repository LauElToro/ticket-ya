import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Calendar, MapPin, ArrowRight, Clock, AlertCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface EventCardProps {
  id: string | number;
  title: string;
  image: string;
  date: string;
  time?: string;
  venue: string;
  city: string;
  price: number;
  category: string;
  rawDate?: Date;
  availableTickets?: number;
  totalTickets?: number;
}

const EventCard = ({ 
  id, 
  title, 
  image, 
  date, 
  time,
  venue, 
  city, 
  price, 
  category,
  rawDate,
  availableTickets,
  totalTickets,
}: EventCardProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!rawDate) return;

    const updateCountdown = () => {
      const now = new Date();
      const eventDate = new Date(rawDate);
      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [rawDate]);

  // Calcular si quedan pocas entradas (menos del 20% o menos de 50 entradas)
  const fewTicketsLeft = availableTickets !== undefined && totalTickets !== undefined && 
    (availableTickets < 50 || (availableTickets / totalTickets) < 0.2);

  // Calcular si queda poco tiempo (menos de 3 días)
  const littleTimeLeft = rawDate && (() => {
    const now = new Date();
    const eventDate = new Date(rawDate);
    const diff = eventDate.getTime() - now.getTime();
    const daysLeft = diff / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 3;
  })();

  // Calcular si queda menos de 1 semana (para mostrar contador)
  const showCountdown = rawDate && timeLeft && (() => {
    const now = new Date();
    const eventDate = new Date(rawDate);
    const diff = eventDate.getTime() - now.getTime();
    const daysLeft = diff / (1000 * 60 * 60 * 24);
    return daysLeft > 0 && daysLeft <= 7;
  })();

  return (
    <Link to={`/evento/${id}`} className="group block h-full">
      <article className="glass-card rounded-2xl overflow-hidden hover-lift relative h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 flex-shrink-0 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          
          {/* Category Badge */}
          <span className="absolute top-3 left-3 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full z-10 whitespace-nowrap">
            {category}
          </span>

          {/* Urgency Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            {fewTicketsLeft && (
              <Badge variant="destructive" className="text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Pocas entradas
              </Badge>
            )}
            {littleTimeLeft && !showCountdown && (
              <Badge variant="destructive" className="text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
                <Timer className="w-3 h-3 flex-shrink-0" />
                Últimas horas
              </Badge>
            )}
          </div>

          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-lg z-10">
            <span className="text-sm font-bold text-foreground whitespace-nowrap">
              Desde ${price.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 flex flex-col flex-grow min-h-0">
          <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-secondary transition-colors min-h-[3.5rem]">
            {title}
          </h3>

          <div className="space-y-2 mb-4 flex-shrink-0">
            <div className="flex items-center gap-2 text-muted-foreground text-sm min-h-[1.5rem]">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{date}</span>
            </div>
            {time && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm min-h-[1.5rem]">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{time}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-sm min-h-[1.5rem]">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{venue}, {city}</span>
            </div>
          </div>

          {/* Countdown Timer */}
          {showCountdown && timeLeft && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex-shrink-0">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <span className="text-destructive font-semibold flex items-center gap-1 whitespace-nowrap">
                  <Timer className="w-4 h-4 flex-shrink-0" />
                  Tiempo restante:
                </span>
                <div className="flex items-center gap-2 font-mono font-bold text-destructive flex-wrap">
                  {timeLeft.days > 0 && (
                    <span className="px-2 py-1 bg-destructive/20 rounded whitespace-nowrap">
                      {String(timeLeft.days).padStart(2, '0')}d
                    </span>
                  )}
                  <span className="px-2 py-1 bg-destructive/20 rounded whitespace-nowrap">
                    {String(timeLeft.hours).padStart(2, '0')}h
                  </span>
                  <span className="px-2 py-1 bg-destructive/20 rounded whitespace-nowrap">
                    {String(timeLeft.minutes).padStart(2, '0')}m
                  </span>
                  {timeLeft.days === 0 && (
                    <span className="px-2 py-1 bg-destructive/20 rounded whitespace-nowrap">
                      {String(timeLeft.seconds).padStart(2, '0')}s
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full mt-auto group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-all flex-shrink-0"
          >
            Ver más
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1 flex-shrink-0" />
          </Button>
        </div>
      </article>
    </Link>
  );
};

export default EventCard;
