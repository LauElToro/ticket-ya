import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Music, Theater, Mic, PartyPopper, Trophy, Sparkles, Film, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { eventsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';

const categoryIcons: Record<string, any> = {
  'Música': Music,
  'Teatro': Theater,
  'Stand Up': Mic,
  'Fiestas': PartyPopper,
  'Deportes': Trophy,
  'Festival': Sparkles,
  'Cine': Film,
  'Gaming': Gamepad2,
};

interface CategoriesProps {
  onCategoryChange?: (category: string) => void;
}

const Categories = ({ onCategoryChange }: CategoriesProps) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  // Obtener eventos para extraer categorías dinámicas
  const { data: eventsResponse, error } = useQuery({
    queryKey: ['events-categories'],
    queryFn: () => eventsApi.list({ limit: 100 }),
    retry: 1,
    staleTime: 60000,
  });

  const categories = useMemo(() => {
    if (error || !eventsResponse?.data) {
      return [
        { id: 'all', label: 'Todos', icon: Sparkles, color: 'from-pulso-purple via-pulso-magenta to-pulso-coral' },
        { id: 'musica', label: 'Música', icon: Music, color: 'from-pulso-purple via-pulso-magenta to-pulso-purple' },
        { id: 'teatro', label: 'Teatro', icon: Theater, color: 'from-pulso-blue via-pulso-purple to-pulso-blue' },
        { id: 'standup', label: 'Stand Up', icon: Mic, color: 'from-pulso-coral via-pulso-orange to-pulso-coral' },
        { id: 'fiestas', label: 'Fiestas', icon: PartyPopper, color: 'from-pulso-yellow via-pulso-orange to-pulso-yellow' },
        { id: 'deportes', label: 'Deportes', icon: Trophy, color: 'from-pulso-green via-pulso-yellow to-pulso-green' },
      ];
    }

    const eventsData = Array.isArray(eventsResponse.data) 
      ? eventsResponse.data 
      : (eventsResponse.data?.events || []);

    const cats = new Set<string>();
    if (Array.isArray(eventsData)) {
      eventsData.forEach((event: any) => {
        if (event?.category) cats.add(event.category);
      });
    }

    const categoryList = Array.from(cats).sort().map((cat, index) => {
      // Paleta de colores PULSO
      const colors = [
        'from-pulso-purple via-pulso-magenta to-pulso-purple',
        'from-pulso-coral via-pulso-orange to-pulso-coral',
        'from-pulso-blue via-pulso-purple to-pulso-blue',
        'from-pulso-green via-pulso-yellow to-pulso-green',
        'from-pulso-magenta via-pulso-purple to-pulso-magenta',
        'from-pulso-yellow via-pulso-orange to-pulso-yellow',
      ];
      return {
        id: cat.toLowerCase().replace(/\s+/g, ''),
        label: cat,
        icon: categoryIcons[cat] || Sparkles,
        color: colors[index % colors.length],
      };
    });

    return [
      { id: 'all', label: 'Todos', icon: Sparkles, color: 'from-primary via-secondary to-primary' },
      ...categoryList,
    ];
  }, [eventsResponse, error]);

  const handleCategoryClick = (categoryId: string, categoryLabel: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
    
    // Navegar a eventos con el filtro de categoría
    if (categoryId === 'all') {
      navigate('/eventos');
    } else {
      navigate(`/eventos?category=${categoryLabel}`);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-background via-background to-muted/20 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Explorá por categoría
          </h2>
          <p className="text-muted-foreground text-base md:text-lg">
            Descubrí eventos según tus intereses
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 max-w-5xl mx-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id, category.label)}
                className={cn(
                  'group relative overflow-hidden rounded-2xl transition-all duration-300',
                  'hover:scale-110 hover:shadow-2xl',
                  'min-w-[140px] md:min-w-[160px]',
                  isActive
                    ? 'shadow-2xl scale-105'
                    : 'shadow-lg hover:shadow-xl'
                )}
              >
                {/* Background gradient cuando está activo */}
                {isActive ? (
                  <div className={cn(
                    'absolute inset-0 bg-gradient-to-br opacity-100',
                    category.color
                  )} />
                ) : (
                  <div className="absolute inset-0 bg-card border-2 border-border group-hover:border-primary/50 transition-colors" />
                )}
                
                {/* Content */}
                <div className={cn(
                  'relative z-10 flex flex-col items-center gap-4 p-6 md:p-8',
                  isActive ? 'text-white' : 'text-foreground'
                )}>
                  <div className={cn(
                    'p-4 rounded-2xl transition-all duration-300 shadow-lg',
                    isActive
                      ? 'bg-white/20 backdrop-blur-sm scale-110'
                      : 'bg-gradient-to-br from-muted to-muted/50 group-hover:from-primary/10 group-hover:to-secondary/10'
                  )}>
                    <Icon className={cn(
                      'w-8 h-8 md:w-10 md:h-10 transition-all duration-300',
                      isActive ? 'text-white' : 'text-primary group-hover:scale-110'
                    )} />
                  </div>
                  <span className={cn(
                    'font-bold text-base md:text-lg text-center transition-colors',
                    isActive ? 'text-white' : 'text-foreground'
                  )}>
                    {category.label}
                  </span>
                </div>
                
                {/* Hover effect overlay */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-secondary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-secondary/10 group-hover:to-primary/10 transition-all duration-300 rounded-2xl" />
                )}
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
