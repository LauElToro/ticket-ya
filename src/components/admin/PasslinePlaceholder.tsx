import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ArrowLeft, Construction } from 'lucide-react';

interface PasslinePlaceholderProps {
  title: string;
  extraAction?: { label: string; href: string };
}

export function PasslinePlaceholder({ title, extraAction }: PasslinePlaceholderProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-24 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al evento
        </Button>
        <div className="border rounded-lg p-12 text-center">
          <Construction className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground mb-6">Esta funcionalidad está en desarrollo y estará disponible próximamente.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {extraAction && (
              <Button variant="outline" onClick={() => navigate(extraAction.href)}>
                {extraAction.label}
              </Button>
            )}
            <Button onClick={() => navigate(`/admin/events/${id}`)}>Volver al panel del evento</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
