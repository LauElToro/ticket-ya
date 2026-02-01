import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ClipboardList, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

const ResumenAcreditacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['event-validations', id],
    queryFn: () => adminApi.getEventValidations(id!),
    enabled: !!id,
  });

  const validations = data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-24 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al evento
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-6 h-6 text-emerald-600" />
              Resumen de acreditación
            </CardTitle>
            <CardDescription>
              Historial de entradas escaneadas en el ingreso al evento. Los porteros registran cada validación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {validations.length} acreditaciones registradas
              </p>
              <Button variant="outline" size="sm" onClick={() => navigate('/portero/scan')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Ir a escanear
              </Button>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : validations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No hay acreditaciones registradas aún.</p>
                <p className="text-sm mt-1">Los escaneos aparecerán aquí cuando los porteros validen entradas.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-3 px-4">Fecha/Hora</th>
                      <th className="text-left py-3 px-4">Titular</th>
                      <th className="text-left py-3 px-4">Tipo entrada</th>
                      <th className="text-left py-3 px-4">Acreditador</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validations.map((v: any) => (
                      <tr key={v.id} className="border-t">
                        <td className="py-3 px-4">
                          {new Date(v.scannedAt).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4">
                          {v.ticket?.owner?.name || '-'}
                          {v.ticket?.owner?.email && (
                            <span className="text-muted-foreground text-xs block">{v.ticket.owner.email}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">{v.ticket?.ticketType?.name || '-'}</td>
                        <td className="py-3 px-4">{v.validator?.name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResumenAcreditacion;
