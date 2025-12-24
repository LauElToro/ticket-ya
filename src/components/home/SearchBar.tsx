import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Calendar, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (city) params.append('city', city);
    if (date) params.append('dateFrom', date);
    navigate(`/eventos?${params.toString()}`);
  };

  return (
    <section className="relative -mt-20 z-10 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        <Card className="border-2 shadow-2xl bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Encontrá tu próximo evento</h2>
                <p className="text-sm text-muted-foreground">Buscá por nombre, ciudad o fecha</p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Search Input - Ocupa más espacio */}
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    type="text"
                    placeholder="Buscar evento, artista o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 text-base bg-background border-2 border-border focus:border-primary transition-colors"
                  />
                </div>

                {/* City Filter */}
                <div className="md:col-span-3 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-14 pl-12 pr-10 rounded-lg border-2 border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors font-medium"
                  >
                    <option value="">Todas las ciudades</option>
                    <option value="Buenos Aires">Buenos Aires</option>
                    <option value="Córdoba">Córdoba</option>
                    <option value="Rosario">Rosario</option>
                    <option value="Mendoza">Mendoza</option>
                    <option value="La Plata">La Plata</option>
                    <option value="Tucumán">Tucumán</option>
                    <option value="Mar del Plata">Mar del Plata</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Date Filter */}
                <div className="md:col-span-2 relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10 pointer-events-none" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-12 h-14 text-base bg-background border-2 border-border focus:border-primary transition-colors"
                  />
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                  <Button 
                    type="submit" 
                    variant="gradient" 
                    className="w-full h-14 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Buscar
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SearchBar;
