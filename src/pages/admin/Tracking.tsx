import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  Facebook, 
  ExternalLink, 
  AlertCircle, 
  Info,
  Copy,
  Loader2,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventMetricsCard from '@/components/EventMetricsCard';
import { useNavigate } from 'react-router-dom';

const Tracking = () => {
  const navigate = useNavigate();

  // Obtener eventos del usuario para mostrar métricas
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => adminApi.getEvents({}),
  });

  const events = eventsData?.data?.events || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado',
      description: 'Texto copiado al portapapeles',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Dashboard
              </Button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Configuración de Tracking</h1>
                <p className="text-muted-foreground mt-1">
                  Configura Meta Pixel y Google Ads para obtener métricas de tus eventos
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="instructions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">
                <BookOpen className="w-4 h-4 mr-2" />
                Instrucciones
              </TabsTrigger>
              <TabsTrigger value="metrics">
                <BarChart3 className="w-4 h-4 mr-2" />
                Métricas
              </TabsTrigger>
            </TabsList>

            {/* Tab: Instrucciones */}
            <TabsContent value="instructions" className="space-y-6">
              {/* Meta Pixel */}
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Facebook className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Meta Pixel (Facebook)</CardTitle>
                      <CardDescription>
                        Obtén métricas de conversión y audiencias de Facebook e Instagram
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="meta-pixel-steps">
                      <AccordionTrigger className="font-semibold">
                        ¿Cómo obtener mi Meta Pixel ID?
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-3">
                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              1
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Accede a Meta Events Manager</p>
                              <p className="text-sm text-muted-foreground">
                                Ve a{' '}
                                <a
                                  href="https://business.facebook.com/events_manager2"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  business.facebook.com/events_manager2
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              2
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Selecciona o crea un Pixel</p>
                              <p className="text-sm text-muted-foreground">
                                Si ya tienes un Pixel, selecciónalo. Si no, haz clic en "Conectar datos" y luego "Web"
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              3
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Copia tu Pixel ID</p>
                              <p className="text-sm text-muted-foreground">
                                En la configuración del Pixel, encontrarás tu ID (un número de 15-16 dígitos).
                                Cópialo y pégalo en el formulario de tu evento.
                              </p>
                              <div className="mt-2 p-3 bg-background rounded border border-dashed">
                                <code className="text-sm">Ejemplo: 123456789012345</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 h-6"
                                  onClick={() => copyToClipboard('123456789012345')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex gap-2">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                ¿Para qué sirve?
                              </p>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                Meta Pixel te permite rastrear conversiones, crear audiencias personalizadas,
                                optimizar campañas publicitarias y medir el ROI de tus anuncios en Facebook e Instagram.
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Google Ads */}
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Google Ads</CardTitle>
                      <CardDescription>
                        Rastrea conversiones y optimiza tus campañas publicitarias en Google
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="google-ads-steps">
                      <AccordionTrigger className="font-semibold">
                        ¿Cómo obtener mi Google Ads ID?
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-3">
                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              1
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Accede a Google Ads</p>
                              <p className="text-sm text-muted-foreground">
                                Ve a{' '}
                                <a
                                  href="https://ads.google.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  ads.google.com
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                {' '}e inicia sesión con tu cuenta
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              2
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Ve a Herramientas y Configuración</p>
                              <p className="text-sm text-muted-foreground">
                                En el menú superior, haz clic en "Herramientas y configuración" → "Conversiones"
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              3
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Crea o selecciona una acción de conversión</p>
                              <p className="text-sm text-muted-foreground">
                                Crea una nueva acción de conversión para "Compra" o selecciona una existente
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              4
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold mb-1">Copia tu ID de conversión</p>
                              <p className="text-sm text-muted-foreground">
                                En la configuración de la acción, encontrarás tu ID de conversión (formato: AW-XXXXXXXXX).
                                Cópialo y pégalo en el formulario de tu evento.
                              </p>
                              <div className="mt-2 p-3 bg-background rounded border border-dashed">
                                <code className="text-sm">Ejemplo: AW-123456789</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-2 h-6"
                                  onClick={() => copyToClipboard('AW-123456789')}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex gap-2">
                            <Info className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                ¿Para qué sirve?
                              </p>
                              <p className="text-sm text-green-800 dark:text-green-200">
                                Google Ads te permite rastrear compras, medir el rendimiento de tus campañas,
                                optimizar pujas automáticamente y ver qué anuncios generan más conversiones.
                              </p>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Métricas */}
            <TabsContent value="metrics" className="space-y-6">
              {isLoadingEvents ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                      <p className="text-muted-foreground">Cargando eventos...</p>
                    </div>
                  </CardContent>
                </Card>
              ) : events.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No tienes eventos creados</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {events
                    .filter((event: any) => event.metaPixelId || event.googleAdsId)
                    .map((event: any) => (
                      <EventMetricsCard key={event.id} event={event} />
                    ))}
                  {events.filter((event: any) => event.metaPixelId || event.googleAdsId).length === 0 && (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground mb-4">
                            No tienes eventos con tracking configurado
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Configura Meta Pixel ID o Google Ads ID en el Dashboard para que se apliquen automáticamente a todos tus eventos
                          </p>
                          <Button
                            onClick={() => navigate('/admin/dashboard')}
                            variant="outline"
                          >
                            Ir al Dashboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tracking;

