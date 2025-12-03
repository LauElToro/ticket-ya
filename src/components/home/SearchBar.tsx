import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/eventos?q=${searchQuery}&city=${city}&date=${date}`);
  };

  return (
    <section className="relative -mt-20 z-10 px-4">
      <div className="container mx-auto">
        <form
          onSubmit={handleSearch}
          className="glass-card rounded-2xl p-4 md:p-6 animate-fade-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar evento o artista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background border-border"
              />
            </div>

            {/* City Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Todas las ciudades</option>
                <option value="buenos-aires">Buenos Aires</option>
                <option value="cordoba">Córdoba</option>
                <option value="rosario">Rosario</option>
                <option value="mendoza">Mendoza</option>
                <option value="la-plata">La Plata</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="pl-10 h-12 bg-background border-border"
              />
            </div>
          </div>

          {/* Search Button (mobile) */}
          <div className="mt-4 md:hidden">
            <Button type="submit" variant="gradient" className="w-full h-12">
              <Search className="w-5 h-5 mr-2" />
              Buscar eventos
            </Button>
          </div>

          {/* Search Button (desktop - integrated) */}
          <div className="hidden md:block mt-4">
            <Button type="submit" variant="gradient" size="lg">
              <Search className="w-5 h-5 mr-2" />
              Buscar eventos
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SearchBar;
