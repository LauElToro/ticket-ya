import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventCard, { EventCardProps } from '@/components/home/EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, Loader2 } from 'lucide-react';
import { eventsApi } from '@/lib/api';

const Eventos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [showFilters, setShowFilters] = useState(false);

  // Obtener eventos de la API con debounce en búsqueda
  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['events', searchQuery, selectedCategory, selectedCity],
    queryFn: () => eventsApi.list({
      search: searchQuery || undefined,
      category: selectedCategory !== 'Todos' ? selectedCategory : undefined,
      city: selectedCity !== 'Todas' ? selectedCity : undefined,
    }),
    staleTime: 30000, // Cache por 30 segundos
    retry: 1,
  });

  const allEvents: EventCardProps[] = useMemo(() => {
    // Asegurarse de que data sea un array
    const eventsData = Array.isArray(eventsResponse?.data) 
      ? eventsResponse.data 
      : (eventsResponse?.data?.events || []);
    
    if (!eventsData || eventsData.length === 0) return [];
    
    return eventsData.map((event: any) => {
      // Obtener el precio mínimo de los tipos de entrada
      const minPrice = event.ticketTypes?.length > 0
        ? Math.min(...event.ticketTypes.map((tt: any) => Number(tt.price)))
        : 0;

      // Formatear fecha
      const eventDate = new Date(event.date);
      const formattedDate = eventDate.toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // Construir URL de imagen
      const imageUrl = event.image
        ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}${event.image}`
        : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80';

      return {
        id: event.id,
        title: event.title,
        image: imageUrl,
        date: formattedDate,
        venue: event.venue,
        city: event.city,
        price: minPrice,
        category: event.category,
      };
    });
  }, [eventsResponse]);

  // Obtener categorías y ciudades únicas de los eventos
  const categories = useMemo(() => {
    const cats = new Set<string>();
    const eventsData = Array.isArray(eventsResponse?.data) 
      ? eventsResponse.data 
      : (eventsResponse?.data?.events || []);
    
    if (Array.isArray(eventsData)) {
      eventsData.forEach((event: any) => {
        if (event?.category) cats.add(event.category);
      });
    }
    return ['Todos', ...Array.from(cats).sort()];
  }, [eventsResponse]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    const eventsData = Array.isArray(eventsResponse?.data) 
      ? eventsResponse.data 
      : (eventsResponse?.data?.events || []);
    
    if (Array.isArray(eventsData)) {
      eventsData.forEach((event: any) => {
        if (event?.city) citySet.add(event.city);
      });
    }
    return ['Todas', ...Array.from(citySet).sort()];
  }, [eventsResponse]);

  const filteredEvents = allEvents;

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
              {isLoading ? 'Cargando eventos...' : `Encontrá tu próxima experiencia entre ${allEvents.length} eventos disponibles`}
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
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                No se pudieron cargar los eventos
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              {allEvents.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    {filteredEvents.length} eventos encontrados
                  </p>
                </div>
              )}

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
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              {hasActiveFilters ? (
                <>
                  <h3 className="text-xl font-semibold mb-2">No encontramos eventos con esos filtros</h3>
                  <p className="text-muted-foreground mb-6">
                    Intentá cambiar los filtros de búsqueda
                  </p>
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-2">Aún no hay eventos disponibles</h3>
                  <p className="text-muted-foreground">
                    Los eventos aparecerán aquí cuando estén disponibles
                  </p>
                </>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Eventos;
