import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import EventCard, { EventCardProps } from '@/components/home/EventCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Loader2, Calendar, MapPin, Tag, DollarSign, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { eventsApi } from '@/lib/api';
import { cn, getEventImageUrl } from '@/lib/utils';

const Eventos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  // Obtener eventos de la API
  const { data: eventsResponse, isLoading, error } = useQuery({
    queryKey: ['events', searchQuery, selectedCategory, selectedCity, dateFrom, dateTo, sortBy],
    queryFn: () => eventsApi.list({
      search: searchQuery || undefined,
      category: selectedCategory !== 'Todos' ? selectedCategory : undefined,
      city: selectedCity !== 'Todas' ? selectedCity : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    staleTime: 30000,
    retry: 1,
  });

  const allEvents: EventCardProps[] = useMemo(() => {
    const eventsData = Array.isArray(eventsResponse?.data) 
      ? eventsResponse.data 
      : (eventsResponse?.data?.events || []);
    
    if (!eventsData || eventsData.length === 0) return [];
    
    // Filtrar eventos vencidos (que ya pasaron su fecha)
    const now = new Date();
    const activeEvents = eventsData.filter((event: any) => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      return eventDate >= now;
    });
    
    let mapped = activeEvents.map((event: any) => {
      let minPrice = 0;
      if (event.tandas && event.tandas.length > 0) {
        const prices: number[] = [];
        const now = new Date();
        
        event.tandas.forEach((tanda: any) => {
          if (!tanda.isActive) return;
          
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

      const imageUrl = getEventImageUrl(event.image, '800');

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

    // Ordenar eventos
    mapped.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return a.rawDate.getTime() - b.rawDate.getTime();
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return mapped;
  }, [eventsResponse, sortBy]);

  // Obtener categorías y ciudades únicas
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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
    setSelectedCity('Todas');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'Todos' || selectedCity !== 'Todas' || dateFrom || dateTo;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Todos los eventos
            </h1>
            <p className="text-muted-foreground text-lg">
              {isLoading ? 'Cargando eventos...' : `Encontrá tu próxima experiencia entre ${allEvents.length} eventos disponibles`}
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-6 border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar evento, artista o categoría..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filters & Sort */}
          <div className="mb-8 flex flex-col lg:flex-row gap-4">
            {/* Filters Card */}
            <Card className="flex-1 border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    Filtros
                  </CardTitle>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Categoría */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Tag className="w-4 h-4" />
                      Categoría
                    </Label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Ciudad */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="w-4 h-4" />
                      Ciudad
                    </Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fecha Desde */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      Desde
                    </Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  {/* Fecha Hasta */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Calendar className="w-4 h-4" />
                      Hasta
                    </Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-11"
                      min={dateFrom}
                    />
                  </div>
                </div>

                {/* Active Filters Badges */}
                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Filtros activos:</span>
                    {selectedCategory !== 'Todos' && (
                      <Badge variant="secondary" className="gap-1">
                        <Tag className="w-3 h-3" />
                        {selectedCategory}
                      </Badge>
                    )}
                    {selectedCity !== 'Todas' && (
                      <Badge variant="secondary" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {selectedCity}
                      </Badge>
                    )}
                    {dateFrom && (
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        Desde: {new Date(dateFrom).toLocaleDateString('es-AR')}
                      </Badge>
                    )}
                    {dateTo && (
                      <Badge variant="secondary" className="gap-1">
                        <Calendar className="w-3 h-3" />
                        Hasta: {new Date(dateTo).toLocaleDateString('es-AR')}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sort Card */}
            <Card className="lg:w-64 border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpDown className="w-5 h-5" />
                  Ordenar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Fecha (próximos)</SelectItem>
                    <SelectItem value="price-asc">Precio (menor a mayor)</SelectItem>
                    <SelectItem value="price-desc">Precio (mayor a menor)</SelectItem>
                    <SelectItem value="name">Nombre (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando eventos...</p>
            </div>
          ) : error ? (
            <Card className="border-2 shadow-lg">
              <CardContent className="text-center py-16">
                <p className="text-xl text-muted-foreground mb-4">
                  No se pudieron cargar los eventos
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {allEvents.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{allEvents.length}</span> eventos encontrados
                  </p>
                </div>
              )}

              {/* Events Grid */}
              {allEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {allEvents.map((event, index) => (
                    <div 
                      key={event.id}
                      className="animate-fade-up h-full"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <EventCard {...event} />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-2 shadow-lg bg-gradient-to-br from-card to-card/80">
                  <CardContent className="text-center py-16">
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
                          <X className="w-4 h-4 mr-2" />
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
                  </CardContent>
                </Card>
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
