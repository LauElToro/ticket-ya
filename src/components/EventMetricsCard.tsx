import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trackingApi } from '@/lib/api';
import { 
  BarChart3, 
  Facebook, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Eye,
  ShoppingCart,
  CheckCircle2,
  Calendar,
  Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface EventMetricsCardProps {
  event: {
    id: string;
    title: string;
    metaPixelId?: string | null;
    googleAdsId?: string | null;
    date: string;
  };
}

const EventMetricsCard = ({ event }: EventMetricsCardProps) => {
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [googleCredentials, setGoogleCredentials] = useState({
    customerId: '',
    refreshToken: '',
    clientId: '',
    clientSecret: '',
  });
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  // Obtener métricas de Meta Pixel
  const { data: metaMetrics, isLoading: isLoadingMeta, refetch: refetchMeta } = useQuery({
    queryKey: ['meta-metrics', event.id, dateRange.start, dateRange.end, metaAccessToken],
    queryFn: () => trackingApi.getMetaPixelMetrics(event.id, {
      startDate: dateRange.start,
      endDate: dateRange.end,
      accessToken: metaAccessToken || undefined,
    }),
    enabled: !!event.metaPixelId && !!metaAccessToken,
    retry: false,
  });

  // Obtener métricas de Google Ads
  const { data: googleMetrics, isLoading: isLoadingGoogle, refetch: refetchGoogle } = useQuery({
    queryKey: ['google-metrics', event.id, dateRange.start, dateRange.end, googleCredentials],
    queryFn: () => trackingApi.getGoogleAdsMetrics(event.id, {
      startDate: dateRange.start,
      endDate: dateRange.end,
      ...googleCredentials,
    }),
    enabled: !!event.googleAdsId && !!googleCredentials.customerId && !!googleCredentials.refreshToken,
    retry: false,
  });

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <CardDescription>
              {new Date(event.date).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {event.metaPixelId && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Facebook className="w-3 h-3" />
                Meta Pixel
              </Badge>
            )}
            {event.googleAdsId && (
              <Badge variant="outline" className="flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Google Ads
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="meta" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            {event.metaPixelId && (
              <TabsTrigger value="meta">
                <Facebook className="w-4 h-4 mr-2" />
                Meta Pixel
              </TabsTrigger>
            )}
            {event.googleAdsId && (
              <TabsTrigger value="google">
                <BarChart3 className="w-4 h-4 mr-2" />
                Google Ads
              </TabsTrigger>
            )}
          </TabsList>

          {/* Meta Pixel Metrics */}
          {event.metaPixelId && (
            <TabsContent value="meta" className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Configuración requerida
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      Para ver métricas de Meta Pixel, necesitas un Access Token de Facebook.
                    </p>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside mb-3">
                      <li>Ve a{' '}
                        <a
                          href="https://developers.facebook.com/tools/explorer"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-semibold"
                        >
                          Graph API Explorer
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </a>
                      </li>
                      <li>Selecciona tu app y Pixel</li>
                      <li>Copia el Access Token generado</li>
                      <li>Pégalo en el campo de abajo</li>
                    </ol>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      ⚠️ El token expira después de un tiempo. Para tokens permanentes, configura una App de Facebook.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`meta-token-${event.id}`}>Access Token de Facebook</Label>
                  <div className="flex gap-2">
                    <Input
                      id={`meta-token-${event.id}`}
                      type="password"
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                      placeholder="EAAxxxxxxxxxxxxx"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => refetchMeta()}
                      disabled={!metaAccessToken || isLoadingMeta}
                    >
                      {isLoadingMeta ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Cargar Métricas'
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {metaMetrics?.data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vistas de Página</p>
                          <p className="text-2xl font-bold">{metaMetrics.data.events?.PageView || 0}</p>
                        </div>
                        <Eye className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Vistas de Contenido</p>
                          <p className="text-2xl font-bold">{metaMetrics.data.events?.ViewContent || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Inicios de Checkout</p>
                          <p className="text-2xl font-bold">{metaMetrics.data.events?.InitiateCheckout || 0}</p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Compras</p>
                          <p className="text-2xl font-bold">{metaMetrics.data.events?.Purchase || 0}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {metaMetrics?.data?.revenue !== undefined && (
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ingresos Rastreados</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                          ${metaMetrics.data.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <DollarSign className="w-12 h-12 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Google Ads Metrics */}
          {event.googleAdsId && (
            <TabsContent value="google" className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex gap-2 mb-3">
                  <Info className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Configuración requerida
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                      Para ver métricas de Google Ads, necesitas configurar OAuth2.
                    </p>
                    <ol className="text-sm text-green-800 dark:text-green-200 space-y-1 list-decimal list-inside mb-3">
                      <li>Crea un proyecto en{' '}
                        <a
                          href="https://console.cloud.google.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-semibold"
                        >
                          Google Cloud Console
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </a>
                      </li>
                      <li>Habilita Google Ads API</li>
                      <li>Configura OAuth2 y obtén un Refresh Token</li>
                      <li>Encuentra tu Customer ID en Google Ads</li>
                      <li>Completa los campos de abajo</li>
                    </ol>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      📖 Consulta la{' '}
                      <a
                        href="https://developers.google.com/google-ads/api/docs/oauth/overview"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        documentación completa
                        <ExternalLink className="w-3 h-3 inline ml-1" />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`google-customer-${event.id}`}>Customer ID</Label>
                    <Input
                      id={`google-customer-${event.id}`}
                      value={googleCredentials.customerId}
                      onChange={(e) => setGoogleCredentials({ ...googleCredentials, customerId: e.target.value })}
                      placeholder="123-456-7890"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`google-refresh-${event.id}`}>Refresh Token</Label>
                    <Input
                      id={`google-refresh-${event.id}`}
                      type="password"
                      value={googleCredentials.refreshToken}
                      onChange={(e) => setGoogleCredentials({ ...googleCredentials, refreshToken: e.target.value })}
                      placeholder="1//xxxxxxxxxxxxx"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`google-client-${event.id}`}>Client ID</Label>
                    <Input
                      id={`google-client-${event.id}`}
                      value={googleCredentials.clientId}
                      onChange={(e) => setGoogleCredentials({ ...googleCredentials, clientId: e.target.value })}
                      placeholder="xxxxx.apps.googleusercontent.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`google-secret-${event.id}`}>Client Secret</Label>
                    <Input
                      id={`google-secret-${event.id}`}
                      type="password"
                      value={googleCredentials.clientSecret}
                      onChange={(e) => setGoogleCredentials({ ...googleCredentials, clientSecret: e.target.value })}
                      placeholder="GOCSPX-xxxxxxxxxxxxx"
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => refetchGoogle()}
                  disabled={!googleCredentials.customerId || !googleCredentials.refreshToken || isLoadingGoogle}
                  className="w-full mt-3"
                >
                  {isLoadingGoogle ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Cargar Métricas'
                  )}
                </Button>
              </div>

              {googleMetrics?.data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Conversiones</p>
                          <p className="text-2xl font-bold">{googleMetrics.data.conversions || 0}</p>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Valor de Conversión</p>
                          <p className="text-2xl font-bold">
                            ${googleMetrics.data.conversionValue?.toLocaleString('es-AR', { minimumFractionDigits: 2 }) || 0}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Clics</p>
                          <p className="text-2xl font-bold">{googleMetrics.data.clicks || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Impresiones</p>
                          <p className="text-2xl font-bold">{googleMetrics.data.impressions || 0}</p>
                        </div>
                        <Eye className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          )}

          {/* Selector de rango de fechas */}
          <div className="flex gap-4 items-end pt-4 border-t">
            <div className="flex-1">
              <Label>Fecha Inicio</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => {
                if (event.metaPixelId && metaAccessToken) refetchMeta();
                if (event.googleAdsId && googleCredentials.customerId) refetchGoogle();
              }}
              variant="outline"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default EventMetricsCard;

