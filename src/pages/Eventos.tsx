import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventCard, { EventCardProps } from '@/components/home/EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

const allEvents: EventCardProps[] = [
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
  {
    id: 7,
    title: 'Taylor Swift - Eras Tour',
    image: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
    date: '10 de Mayo, 2025',
    venue: 'Estadio River Plate',
    city: 'Buenos Aires',
    price: 120000,
    category: 'Música',
  },
  {
    id: 8,
    title: 'El Fantasma de la Ópera',
    image: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
    date: '15 de Mayo, 2025',
    venue: 'Teatro Ópera',
    city: 'Buenos Aires',
    price: 28000,
    category: 'Teatro',
  },
];

const categories = ['Todos', 'Música', 'Teatro', 'Stand Up', 'Fiestas', 'Deportes', 'Festival'];
const cities = ['Todas', 'Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'];

const Eventos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = allEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || event.category === selectedCategory;
    const matchesCity = selectedCity === 'Todas' || event.city === selectedCity;
    return matchesSearch && matchesCategory && matchesCity;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedCity('Todas');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'Todos' || selectedCity !== 'Todas';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Todos los eventos</h1>
            <p className="text-muted-foreground">
              Encontrá tu próxima experiencia entre {allEvents.length} eventos disponibles
            </p>
          </div>

          {/* Search & Filters */}
          <div className="glass-card rounded-xl p-4 md:p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar evento o artista..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                className="md:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>

              {/* Desktop Filters */}
              <div className="hidden md:flex gap-4">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-12 px-4 rounded-lg border border-border bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="h-12 px-4 rounded-lg border border-border bg-background"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Filters */}
            {showFilters && (
              <div className="md:hidden mt-4 pt-4 border-t border-border space-y-4 animate-fade-up">
                <div>
                  <label className="text-sm font-medium mb-2 block">Categoría</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-background"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Ciudad</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-border bg-background"
                  >
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Filtros activos:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpiar todo
                </Button>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredEvents.length} eventos encontrados
            </p>
          </div>

          {/* Events Grid */}
          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredEvents.map((event, index) => (
                <div 
                  key={event.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <EventCard {...event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                No encontramos eventos con esos filtros
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Eventos;
