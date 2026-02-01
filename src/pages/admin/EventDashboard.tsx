import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { GiftModal } from '@/components/admin/GiftModal';
import { EventLinkModal } from '@/components/admin/EventLinkModal';
import {
  Settings,
  Globe,
  LayoutGrid,
  Grid2X2,
  CopyPlus,
  Ticket,
  ShoppingCart,
  Tag,
  Image as ImageIcon,
  Users,
  Send,
  Mail,
  FileText,
  FileDown,
  ClipboardList,
  PieChart,
  ExternalLink,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { useState } from 'react';

interface ActionItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
}

const iconClass = 'w-5 h-5 text-emerald-600';

const EventDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['event-stats', id],
    queryFn: async () => {
      if (!id) throw new Error('ID de evento no proporcionado');
      const response = await adminApi.getEventStats(id);
      if (!response?.data?.event) throw new Error('Evento no encontrado');
      return response;
    },
    retry: 1,
    enabled: !!id,
  });

  const stats = data?.data;
  const event = stats?.event;
  const ticketsSold = stats?.ticketsSold || 0;
  const totalCapacity = event?.ticketTypes?.reduce((s: number, tt: any) => s + (tt.totalQty || 0), 0) || 0;
  const revenue = Number(stats?.revenue || 0);
  const eventDate = event?.date ? new Date(event.date) : null;

  const getEventStatus = () => {
    if (!eventDate) return 'N/A';
    const now = new Date();
    if (eventDate < now) return 'Finalizado';
    if (event?.isActive) return 'Activo';
    return 'Pausado';
  };

  const eventLink = event
    ? `${window.location.origin}/evento/${event.id}${event.privateLink ? `?link=${event.privateLink}` : ''}`
    : '';


  const nav = (path: string) => () => navigate(path);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-48">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-48">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Evento no encontrado</p>
            <button onClick={() => navigate('/admin/dashboard')} className="text-primary hover:underline">
              Ir al Dashboard
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const col1: ActionItem[] = [
    { label: 'Edita tu evento', icon: <Settings className={iconClass} />, onClick: nav(`/admin/events/${id}/edit`) },
    { label: 'Link del evento', icon: <Globe className={iconClass} />, onClick: () => setShowLinkModal(true) },
    { label: 'Activar Planimetría', icon: <LayoutGrid className={iconClass} />, path: 'planimetria' },
    { label: 'Funciones del Evento', icon: <Grid2X2 className={iconClass} />, path: 'funciones' },
    { label: 'Clonar Evento', icon: <CopyPlus className={iconClass} />, onClick: nav(`/admin/events/${id}/clonar`) },
    { label: 'Edita y administra tus eTickets', icon: <Ticket className={iconClass} />, onClick: nav(`/admin/events/${id}/edit`) },
    { label: 'Edita y administra tus consumos', icon: <ShoppingCart className={iconClass} />, path: 'consumos' },
    { label: 'Códigos Descuentos', icon: <Tag className={iconClass} />, onClick: nav(`/admin/events/${id}/descuentos`) },
    { label: 'Galería de Imágenes', icon: <ImageIcon className={iconClass} />, onClick: nav(`/admin/events/${id}/edit`) },
  ];

  const col2: ActionItem[] = [
    { label: 'Solicitud de ticket físicos', icon: <Ticket className={iconClass} />, path: 'tickets-fisicos' },
    { label: 'Lista Digital', icon: <Users className={iconClass} />, path: 'lista-digital' },
    { label: 'Links RRPP', icon: <Users className={iconClass} />, path: 'links-rrpp' },
    { label: 'Envía cortesías', icon: <Send className={iconClass} />, onClick: () => setShowGiftModal(true) },
    { label: 'Envía cortesías por base de datos', icon: <Mail className={iconClass} />, path: 'cortesias-base' },
    { label: 'Envía cortesías de consumos', icon: <Send className={iconClass} />, path: 'cortesias-consumos' },
    { label: 'Envía cortesías a RRPP', icon: <Send className={iconClass} />, path: 'cortesias-rrpp' },
    { label: 'Lista de Espera', icon: <Mail className={iconClass} />, path: 'lista-espera' },
  ];

  const col3: ActionItem[] = [
    { label: 'Tickets vendidos y cortesías enviadas', icon: <ShoppingBag className={iconClass} />, onClick: nav(`/admin/events/${id}/stats`) },
    { label: 'Consumos vendidos y cortesías enviadas', icon: <ShoppingBag className={iconClass} />, path: 'stats-consumos' },
    { label: 'Resumen de Ventas', icon: <FileText className={iconClass} />, onClick: nav(`/admin/events/${id}/stats`) },
    { label: 'Informe de Ventas', icon: <FileText className={iconClass} />, onClick: nav('/admin/metrics') },
    { label: 'Liquidación de Evento', icon: <FileDown className={iconClass} />, path: 'liquidacion' },
    { label: 'Acreditar', icon: <LayoutGrid className={iconClass} />, path: 'acreditar' },
    { label: 'Resumen de acreditación', icon: <ClipboardList className={iconClass} />, onClick: nav(`/admin/events/${id}/resumen-acreditacion`) },
    { label: 'Visitas', icon: <PieChart className={iconClass} />, onClick: nav('/admin/metrics') },
    { label: 'Pixel de Meta', icon: <PieChart className={iconClass} />, onClick: nav('/admin/tracking') },
    { label: 'Pixel de TikTok', icon: <PieChart className={iconClass} />, path: 'pixel-tiktok' },
    { label: 'Landing Page', icon: <Globe className={iconClass} />, onClick: () => window.open(`/evento/${event.id}`, '_blank') },
  ];

  const handleAction = (item: ActionItem) => {
    if (item.onClick) item.onClick();
    else if (item.path) navigate(`/admin/events/${id}/${item.path}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6 pt-24">
        {/* Tabla superior - exacta como la imagen */}
        <div className="border rounded-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Configuración Evento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Lugar / País</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Código</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Llave</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Fecha evento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Aforo</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Venta WEB</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="py-3 px-4 font-medium">{event.title}</td>
                <td className="py-3 px-4">{event.venue} / {event.city}</td>
                <td className="py-3 px-4 font-mono text-sm">{id?.slice(-4) || '-'}</td>
                <td className="py-3 px-4 font-mono text-sm">{event.privateLink || '-'}</td>
                <td className="py-3 px-4">
                  {eventDate ? eventDate.toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : '-'}
                </td>
                <td className="py-3 px-4">{ticketsSold} de {totalCapacity}</td>
                <td className="py-3 px-4">$ {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(revenue)}</td>
                <td className="py-3 px-4">{getEventStatus()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tres columnas de funcionalidades */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[col1, col2, col3].map((col, colIdx) => (
            <div key={colIdx} className="space-y-0">
              {col.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleAction(item)}
                  className="w-full flex items-center gap-3 py-3 px-2 text-left rounded hover:bg-muted/50 transition-colors"
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {showGiftModal && id && (
        <GiftModal eventId={id} onClose={() => setShowGiftModal(false)} />
      )}
      {showLinkModal && (
        <EventLinkModal
          open={showLinkModal}
          onOpenChange={setShowLinkModal}
          eventLink={eventLink}
        />
      )}
      <Footer />
    </div>
  );
};

export default EventDashboard;
