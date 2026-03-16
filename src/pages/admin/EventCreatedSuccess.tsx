import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, Gift, Wine, ImageIcon } from 'lucide-react';

const EventCreatedSuccess = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const event = (location.state as any)?.event;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
              <Ticket className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">¡Evento creado de forma exitosa!</h1>
          </div>

          {event && (
            <Card className="mb-8 border-2">
              <CardContent className="p-6">
                <div className="p-4 rounded-lg bg-muted/50 space-y-1">
                  <p className="font-semibold">
                    <span className="text-muted-foreground">Evento:</span>{' '}
                    {event.title || 'Sin título'}
                  </p>
                  {event.id && (
                    <p className="text-sm text-muted-foreground">
                      Código: {event.id.slice(-6).toUpperCase()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Completá tu evento</CardTitle>
              <CardDescription>
                Mientras gestionamos la creación de tu evento, podés completarlo con información adicional:
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(`/admin/events/${id}/edit`)}
              >
                <ImageIcon className="w-8 h-8 text-primary" />
                <span>Información de tu evento</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(`/admin/events/${id}/edit`)}
              >
                <Ticket className="w-8 h-8 text-primary" />
                <span>Tickets</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(`/admin/events/${id}`)}
              >
                <Gift className="w-8 h-8 text-primary" />
                <span>Cortesías</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => navigate(`/admin/events/${id}`)}
              >
                <Wine className="w-8 h-8 text-primary" />
                <span>Consumos</span>
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/admin/events')}
            >
              Ver todos mis eventos
            </Button>
            <Button
              className="flex-1"
              onClick={() => navigate(`/admin/events/${id}`)}
            >
              Ir al panel del evento
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventCreatedSuccess;
