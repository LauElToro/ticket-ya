import EventCard, { EventCardProps } from './EventCard';

const featuredEvents: EventCardProps[] = [
  {
    id: 1,
    title: 'Coldplay - Music of the Spheres Tour',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    date: '15 de Marzo, 2025',
    venue: 'Estadio River Plate',
    city: 'Buenos Aires',
    price: 45000,
    category: 'Música',
  },
  {
    id: 2,
    title: 'Lollapalooza Argentina 2025',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
    date: '21-23 de Marzo, 2025',
    venue: 'Hipódromo de San Isidro',
    city: 'Buenos Aires',
    price: 85000,
    category: 'Festival',
  },
  {
    id: 3,
    title: 'Soda Stereo Sinfónico',
    image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80',
    date: '5 de Abril, 2025',
    venue: 'Teatro Colón',
    city: 'Buenos Aires',
    price: 35000,
    category: 'Música',
  },
  {
    id: 4,
    title: 'Juan Carlos Copes - Stand Up',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800&q=80',
    date: '12 de Abril, 2025',
    venue: 'Teatro Gran Rex',
    city: 'Buenos Aires',
    price: 12000,
    category: 'Stand Up',
  },
  {
    id: 5,
    title: 'Fiesta Bresh',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
    date: '20 de Abril, 2025',
    venue: 'Groove',
    city: 'Buenos Aires',
    price: 8000,
    category: 'Fiestas',
  },
  {
    id: 6,
    title: 'Boca Juniors vs River Plate',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    date: '28 de Abril, 2025',
    venue: 'La Bombonera',
    city: 'Buenos Aires',
    price: 25000,
    category: 'Deportes',
  },
];

const FeaturedEvents = () => {
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredEvents.map((event, index) => (
            <div 
              key={event.id} 
              className="animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <EventCard {...event} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
