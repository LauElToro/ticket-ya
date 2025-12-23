import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Heart, Loader2, ArrowRight } from 'lucide-react';
import { favoriteApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const Favoritos = () => {
  const { user } = useAuth();

  const { data: favoritesResponse, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => favoriteApi.getFavorites(),
    enabled: !!user,
  });

  const favorites = favoritesResponse?.data || [];

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Iniciá sesión para ver tus favoritos</h3>
              <p className="text-muted-foreground mb-6">
                Necesitás estar logueado para acceder a tus eventos favoritos
              </p>
              <Link to="/login">
                <Button variant="hero">Iniciar sesión</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-secondary" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Mis favoritos</h1>
                <p className="text-muted-foreground">
                  Eventos que te interesan
                </p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Cargando favoritos...</p>
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No tenés favoritos aún</h3>
              <p className="text-muted-foreground mb-6">
                Agregá eventos a favoritos para encontrarlos fácilmente más tarde
              </p>
              <Link to="/eventos">
                <Button variant="hero">
                  Explorar eventos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((event: any, index: number) => {
                const eventDate = new Date(event.date);
                const formattedDate = eventDate.toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                const imageUrl = event.image
                  ? `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}${event.image}`
                  : 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400&q=80';

                const isPast = eventDate < new Date();

                return (
                  <Link
                    key={event.id}
                    to={`/evento/${event.id}`}
                    className={cn(
                      'glass-card rounded-2xl overflow-hidden hover-lift transition-all border-2 border-border hover:border-secondary/50',
                      isPast && 'opacity-60'
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-secondary text-secondary-foreground">
                          {event.category}
                        </Badge>
                      </div>
                      {isPast && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="destructive">Pasado</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{event.title}</h3>
                      {event.subtitle && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{event.subtitle}</p>
                      )}
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.time || '21:00'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.venue}, {event.city}</span>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border">
                        <Button variant="outline" className="w-full" size="sm">
                          Ver detalles
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Favoritos;

