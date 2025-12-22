import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music, Theater, Mic, PartyPopper, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { eventsApi } from '@/lib/api';

const categoryIcons: Record<string, any> = {
  'Música': Music,
  'Teatro': Theater,
  'Stand Up': Mic,
  'Fiestas': PartyPopper,
  'Deportes': Trophy,
  'Festival': Sparkles,
};

interface CategoriesProps {
  onCategoryChange?: (category: string) => void;
}

const Categories = ({ onCategoryChange }: CategoriesProps) => {
  const [activeCategory, setActiveCategory] = useState('all');

  // Obtener eventos para extraer categorías dinámicas
  const { data: eventsResponse, error } = useQuery({
    queryKey: ['events-categories'],
    queryFn: () => eventsApi.list({ limit: 100 }),
    retry: 1,
    staleTime: 60000, // Cache por 1 minuto
  });

  const categories = useMemo(() => {
    // Si hay error o no hay datos, mostrar categorías por defecto
    if (error || !eventsResponse?.data) {
      return [
        { id: 'all', label: 'Todos', icon: Sparkles },
        { id: 'musica', label: 'Música', icon: Music },
        { id: 'teatro', label: 'Teatro', icon: Theater },
        { id: 'standup', label: 'Stand Up', icon: Mic },
        { id: 'fiestas', label: 'Fiestas', icon: PartyPopper },
        { id: 'deportes', label: 'Deportes', icon: Trophy },
      ];
    }

    // Asegurarse de que data sea un array
    const eventsData = Array.isArray(eventsResponse.data) 
      ? eventsResponse.data 
      : (eventsResponse.data?.events || []);

    const cats = new Set<string>();
    if (Array.isArray(eventsData)) {
      eventsData.forEach((event: any) => {
        if (event?.category) cats.add(event.category);
      });
    }

    const categoryList = Array.from(cats).sort().map((cat) => ({
      id: cat.toLowerCase().replace(/\s+/g, ''),
      label: cat,
      icon: categoryIcons[cat] || Sparkles,
    }));

    return [
      { id: 'all', label: 'Todos', icon: Sparkles },
      ...categoryList,
    ];
  }, [eventsResponse, error]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <section className="py-8 md:py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
          Explorá por categoría
        </h2>
        
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  'category-chip flex items-center gap-2',
                  activeCategory === category.id && 'active'
                )}
              >
                <Icon className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
