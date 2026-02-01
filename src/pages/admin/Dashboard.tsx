import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight } from 'lucide-react';
import { GiftModal } from '@/components/admin/GiftModal';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const giftEventId = searchParams.get('eventId');
  const showGift = searchParams.get('gift') === '1';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-events-list'],
    queryFn: () => adminApi.getEvents({ limit: 100 }),
  });

  const events = data?.data?.events || [];

  const handleSelectEvent = (id: string) => {
    navigate(`/admin/events/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12 pt-28">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">Seleccionar evento</h1>
          <Button onClick={() => navigate('/admin/events/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo evento
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando eventos...</div>
        ) : events.length === 0 ? (
          <div className="border rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">No tienes eventos creados</p>
            <Button onClick={() => navigate('/admin/events/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Crear primer evento
            </Button>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            {events.map((event: any) => (
              <button
                key={event.id}
                onClick={() => handleSelectEvent(event.id)}
                className="w-full flex items-center justify-between py-4 px-4 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
              >
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(event.date).toLocaleDateString('es-AR')} — {event.venue}, {event.city}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </main>

      {showGift && giftEventId && (
        <GiftModal
          eventId={giftEventId}
          onClose={() => navigate('/admin/dashboard')}
        />
      )}

      <Footer />
    </div>
  );
};

export default Dashboard;
