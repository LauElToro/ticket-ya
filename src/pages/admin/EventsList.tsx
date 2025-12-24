import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const EventsList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-events', search, currentPage],
    queryFn: () => adminApi.getEvents({ search, page: currentPage, limit: pageSize }),
  });

  const events = data?.data?.events || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };

  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleDelete = async (id: string, eventDate?: string) => {
    const now = new Date();
    const eventDateTime = eventDate ? new Date(eventDate) : null;
    const hasPassed = eventDateTime && eventDateTime < now;
    
    if (hasPassed) {
      toast({ 
        title: 'No se puede borrar', 
        description: 'Los eventos que ya pasaron no se pueden borrar. Quedan guardados en el historial.',
        variant: 'destructive' 
      });
      return;
    }
    
    if (!confirm('¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.')) return;
    
    try {
      await adminApi.deleteEvent(id);
      toast({ title: 'Evento eliminado exitosamente' });
      refetch();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al eliminar evento';
      toast({ 
        title: 'Error al eliminar evento', 
        description: errorMessage.includes('ya pasó') 
          ? 'Los eventos que ya pasaron no se pueden borrar. Quedan guardados en el historial.'
          : errorMessage,
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">Eventos</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Gestiona todos tus eventos</p>
            </div>
            <Button onClick={() => navigate('/admin/events/new')} className="w-full sm:w-auto flex-shrink-0">
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Nuevo Evento</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </div>

          {/* Búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar eventos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Lista de eventos */}
          {isLoading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">No hay eventos</p>
                <Button onClick={() => navigate('/admin/events/new')}>
                  Crear primer evento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {events.map((event: any) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="line-clamp-2 text-base sm:text-lg break-words">{event.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm break-words">
                      {new Date(event.date).toLocaleDateString('es-AR')} - {event.city}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Entradas vendidas:</span>
                        <span className="font-medium">{event._count?.tickets || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-muted-foreground">Estado:</span>
                        <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                          event.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {event.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[100px] text-xs sm:text-sm"
                          onClick={() => navigate(`/admin/events/${event.id}`)}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="hidden sm:inline">Estadísticas</span>
                          <span className="sm:hidden">Stats</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 min-w-[100px] text-xs sm:text-sm"
                          onClick={() => navigate(`/admin/events/${event.id}/edit`)}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() => handleDelete(event.id, event.date)}
                          title={new Date(event.date) < new Date() ? 'Los eventos que ya pasaron no se pueden borrar' : 'Eliminar evento'}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * pageSize + 1} a {Math.min(currentPage * pageSize, pagination.total)} de {pagination.total} eventos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventsList;

