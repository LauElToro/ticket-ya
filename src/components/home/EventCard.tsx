import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface EventCardProps {
  id: string | number;
  title: string;
  image: string;
  date: string;
  venue: string;
  city: string;
  price: number;
  category: string;
}

const EventCard = ({ id, title, image, date, venue, city, price, category }: EventCardProps) => {
  return (
    <Link to={`/evento/${id}`} className="group block">
      <article className="glass-card rounded-2xl overflow-hidden hover-lift">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
          
          {/* Category Badge */}
          <span className="absolute top-3 left-3 px-3 py-1 bg-secondary text-secondary-foreground text-xs font-semibold rounded-full">
            {category}
          </span>

          {/* Price Badge */}
          <div className="absolute bottom-3 right-3 px-3 py-1 bg-card/90 backdrop-blur-sm rounded-lg">
            <span className="text-sm font-bold text-foreground">
              Desde ${price.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5">
          <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-secondary transition-colors">
            {title}
          </h3>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{venue}, {city}</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-all"
          >
            Ver más
            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </article>
    </Link>
  );
};

export default EventCard;
