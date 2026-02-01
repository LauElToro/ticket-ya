import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Tag, Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const CodigosDescuento = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'PERCENT',
    discountValue: '',
    maxUses: '',
    validFrom: '',
    validUntil: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['promoCodes', id],
    queryFn: () => adminApi.getPromoCodes(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createPromoCode(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes', id] });
      setShowForm(false);
      setForm({ code: '', discountType: 'PERCENT', discountValue: '', maxUses: '', validFrom: '', validUntil: '' });
      toast({ title: 'Código creado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (promoId: string) => adminApi.deletePromoCode(id!, promoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promoCodes', id] });
      toast({ title: 'Código eliminado' });
    },
    onError: (err: any) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const promoCodes = data?.data || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast({ title: 'El código es requerido', variant: 'destructive' });
      return;
    }
    if (!form.discountValue || parseFloat(form.discountValue) <= 0) {
      toast({ title: 'El valor de descuento debe ser mayor a 0', variant: 'destructive' });
      return;
    }
    createMutation.mutate({
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      maxUses: form.maxUses ? parseInt(form.maxUses) : 0,
      validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-24 max-w-3xl">
        <Button variant="ghost" onClick={() => navigate(`/admin/events/${id}`)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al evento
        </Button>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-6 h-6 text-emerald-600" />
              Códigos de descuento
            </CardTitle>
            <CardDescription>
              Códigos promocionales: % o monto fijo, cupo limitado, vigencia. Ideal para influencers, preventas o alianzas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowForm(true)} className="mb-4">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo código
            </Button>
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            ) : promoCodes.length === 0 ? (
              <p className="text-muted-foreground py-8">No hay códigos creados. Creá uno para empezar.</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left py-3 px-4">Código</th>
                      <th className="text-left py-3 px-4">Tipo</th>
                      <th className="text-left py-3 px-4">Valor</th>
                      <th className="text-left py-3 px-4">Usos</th>
                      <th className="text-left py-3 px-4">Vigencia</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map((p: any) => (
                      <tr key={p.id} className="border-t">
                        <td className="py-3 px-4 font-mono font-medium">{p.code}</td>
                        <td className="py-3 px-4">{p.discountType === 'PERCENT' ? '%' : 'Monto fijo'}</td>
                        <td className="py-3 px-4">
                          {p.discountType === 'PERCENT'
                            ? `${p.discountValue}%`
                            : `$${Number(p.discountValue).toLocaleString('es-AR')}`}
                        </td>
                        <td className="py-3 px-4">{p.usedCount} / {p.maxUses || '?'}</td>
                        <td className="py-3 px-4">
                          {p.validFrom || p.validUntil
                            ? `${p.validFrom ? new Date(p.validFrom).toLocaleDateString('es-AR') : '...'} - ${p.validUntil ? new Date(p.validUntil).toLocaleDateString('es-AR') : '...'}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMutation.mutate(p.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo código de descuento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label>Código *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="Ej: PREVENTA20"
                maxLength={20}
              />
            </div>
            <div>
              <Label>Tipo de descuento</Label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="w-full h-10 rounded-md border px-3"
              >
                <option value="PERCENT">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo ($)</option>
              </select>
            </div>
            <div>
              <Label>Valor *</Label>
              <Input
                type="number"
                min="0"
                step={form.discountType === 'PERCENT' ? '1' : '0.01'}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'PERCENT' ? '20' : '1000'}
              />
            </div>
            <div>
              <Label>Cupo máximo (0 = ilimitado)</Label>
              <Input
                type="number"
                min="0"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Válido desde</Label>
                <Input
                  type="datetime-local"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>
              <div>
                <Label>Válido hasta</Label>
                <Input
                  type="datetime-local"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CodigosDescuento;
