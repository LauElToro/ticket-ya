import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ClipboardList, Loader2, CheckCircle2, List } from 'lucide-react';

const ResumenAcreditacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showDetalle, setShowDetalle] = useState(false);

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['event-accreditation-summary', id],
    queryFn: () => adminApi.getEventAccreditationSummary(id!),
    enabled: !!id && !showDetalle,
  });

  const { data: validationsData, isLoading: validationsLoading } = useQuery({
    queryKey: ['event-validations', id],
    queryFn: () => adminApi.getEventValidations(id!),
    enabled: !!id && showDetalle,
  });

  const summary = summaryData?.data;
  const validations = validationsData?.data || [];
  const event = summary?.event;

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-24">Evento no especificado.</main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24 max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al evento
          </Button>
          {summary && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => setShowDetalle(!showDetalle)}
            >
              <List className="w-4 h-4 mr-2" />
              {showDetalle ? 'Ver resumen' : 'Ver detalle de acreditación'}
            </Button>
          )}
        </div>

        {showDetalle ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-emerald-600" />
                Detalle de acreditación — {event?.title}
              </CardTitle>
              <CardDescription>
                Historial de entradas escaneadas. Fecha/hora = momento en que se escaneó el QR.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {validationsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : validations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay acreditaciones registradas aún.</p>
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
        ) : (
          <>
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Evento: {event?.title ?? '…'}</h1>
            </div>

            {summaryLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : summary ? (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>E-Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-3 px-4 font-medium">Tipo de tickets</th>
                            <th className="text-center py-3 px-4 font-medium">Validados</th>
                            <th className="text-center py-3 px-4 font-medium">Restante</th>
                            <th className="text-center py-3 px-4 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.eTickets?.map((row: any, i: number) => (
                            <tr key={i} className="border-t">
                              <td className="py-3 px-4">{row.tipo}</td>
                              <td className="py-3 px-4 text-center">{row.validados}</td>
                              <td className="py-3 px-4 text-center">{row.restante}</td>
                              <td className="py-3 px-4 text-center">{row.total}</td>
                            </tr>
                          ))}
                          <tr className="border-t bg-muted/30 font-medium">
                            <td className="py-3 px-4">Total tickets</td>
                            <td className="py-3 px-4 text-center">{summary.totalETickets?.validados ?? 0}</td>
                            <td className="py-3 px-4 text-center">{summary.totalETickets?.restante ?? 0}</td>
                            <td className="py-3 px-4 text-center">{summary.totalETickets?.total ?? 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Consumos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-3 px-4 font-medium">Tipo de consumo</th>
                            <th className="text-center py-3 px-4 font-medium">Validados</th>
                            <th className="text-center py-3 px-4 font-medium">Restante</th>
                            <th className="text-center py-3 px-4 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.consumos?.length ? (
                            summary.consumos.map((row: any, i: number) => (
                              <tr key={i} className="border-t">
                                <td className="py-3 px-4">{row.tipo}</td>
                                <td className="py-3 px-4 text-center">{row.validados}</td>
                                <td className="py-3 px-4 text-center">{row.restante}</td>
                                <td className="py-3 px-4 text-center">{row.total}</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-t">
                              <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                                Sin consumos para este evento
                              </td>
                            </tr>
                          )}
                          <tr className="border-t bg-muted/30 font-medium">
                            <td className="py-3 px-4">Total consumos</td>
                            <td className="py-3 px-4 text-center">{summary.totalConsumos?.validados ?? 0}</td>
                            <td className="py-3 px-4 text-center">{summary.totalConsumos?.restante ?? 0}</td>
                            <td className="py-3 px-4 text-center">{summary.totalConsumos?.total ?? 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tickets físicos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left py-3 px-4 font-medium">Tipo de ticket</th>
                            <th className="text-center py-3 px-4 font-medium">Validados</th>
                            <th className="text-center py-3 px-4 font-medium">Restante</th>
                            <th className="text-center py-3 px-4 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.ticketsFisicos?.length ? (
                            summary.ticketsFisicos.map((row: any, i: number) => (
                              <tr key={i} className="border-t">
                                <td className="py-3 px-4">{row.tipo}</td>
                                <td className="py-3 px-4 text-center">{row.validados}</td>
                                <td className="py-3 px-4 text-center">{row.restante}</td>
                                <td className="py-3 px-4 text-center">{row.total}</td>
                              </tr>
                            ))
                          ) : (
                            <tr className="border-t">
                              <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">
                                Sin tickets físicos
                              </td>
                            </tr>
                          )}
                          <tr className="border-t bg-muted/30 font-medium">
                            <td className="py-3 px-4">Total tickets físicos</td>
                            <td className="py-3 px-4 text-center">{summary.totalTicketsFisicos?.validados ?? 0}</td>
                            <td className="py-3 px-4 text-center">{summary.totalTicketsFisicos?.restante ?? 0}</td>
                            <td className="py-3 px-4 text-center">{summary.totalTicketsFisicos?.total ?? 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ResumenAcreditacion;
