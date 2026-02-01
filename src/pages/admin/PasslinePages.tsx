import { PasslinePlaceholder } from '@/components/admin/PasslinePlaceholder';

export const PlanimetriaPage = () => <PasslinePlaceholder title="Activar Planimetría" />;
export const FuncionesPage = () => <PasslinePlaceholder title="Funciones del Evento" />;
export const ConsumosPage = () => <PasslinePlaceholder title="Edita y administra tus consumos" />;
export const GaleriaPage = () => <PasslinePlaceholder title="Galería de Imágenes" />;
export const TicketsFisicosPage = () => <PasslinePlaceholder title="Solicitud de ticket físicos" />;
export const ListaDigitalPage = () => <PasslinePlaceholder title="Lista Digital" />;
export const LinksRRPPPage = () => <PasslinePlaceholder title="Links RRPP" />;
export const CortesiasBasePage = () => <PasslinePlaceholder title="Envía cortesías por base de datos" />;
export const CortesiasConsumosPage = () => <PasslinePlaceholder title="Envía cortesías de consumos" />;
export const CortesiasRRPPPage = () => <PasslinePlaceholder title="Envía cortesías a RRPP" />;
export const ListaEsperaPage = () => <PasslinePlaceholder title="Lista de Espera" />;
export const StatsConsumosPage = () => <PasslinePlaceholder title="Consumos vendidos y cortesías enviadas" />;
export const LiquidacionPage = () => <PasslinePlaceholder title="Liquidación de Evento" />;
export const AcreditarPage = () => (
  <PasslinePlaceholder
    title="Acreditar"
    extraAction={{ label: 'Ir a escanear tickets', href: '/portero/scan' }}
  />
);
export const PixelTikTokPage = () => <PasslinePlaceholder title="Pixel de TikTok" />;
