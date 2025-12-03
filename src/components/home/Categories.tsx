import { useState } from 'react';
import { Music, Theater, Mic, PartyPopper, Trophy, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'musica', label: 'Música', icon: Music },
  { id: 'teatro', label: 'Teatro', icon: Theater },
  { id: 'standup', label: 'Stand Up', icon: Mic },
  { id: 'fiestas', label: 'Fiestas', icon: PartyPopper },
  { id: 'deportes', label: 'Deportes', icon: Trophy },
];

interface CategoriesProps {
  onCategoryChange?: (category: string) => void;
}

const Categories = ({ onCategoryChange }: CategoriesProps) => {
  const [activeCategory, setActiveCategory] = useState('all');

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
