import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Settings, Save, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AccountingConfig {
  profitMargin: number; // % de ganancia
  fixedCosts: number; // Costos fijos
  variableCostsPercent: number; // % de costos variables sobre ventas
  taxesPercent: number; // % de impuestos
  commissionsPercent: number; // % de comisiones
  platformFeePercent: number; // % de comisión de la plataforma
}

interface AccountingConfigProps {
  config: AccountingConfig;
  onSave: (config: AccountingConfig) => void;
}

const AccountingConfig = ({ config, onSave }: AccountingConfigProps) => {
  const [formData, setFormData] = useState<AccountingConfig>(config);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      // Guardar en localStorage
      localStorage.setItem('accounting-config', JSON.stringify(formData));
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof AccountingConfig, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({ ...prev, [field]: numValue }));
  };

  // Calcular valores derivados para mostrar preview
  const calculatePreview = (revenue: number = 100000) => {
    const variableCosts = (revenue * formData.variableCostsPercent) / 100;
    const taxes = (revenue * formData.taxesPercent) / 100;
    const commissions = (revenue * formData.commissionsPercent) / 100;
    const platformFee = (revenue * formData.platformFeePercent) / 100;
    const totalCosts = formData.fixedCosts + variableCosts + taxes + commissions + platformFee;
    const grossProfit = revenue - totalCosts;
    const profitMargin = (grossProfit / revenue) * 100;
    const netProfit = grossProfit - (revenue * formData.profitMargin) / 100;

    return {
      revenue,
      variableCosts,
      taxes,
      commissions,
      platformFee,
      totalCosts,
      grossProfit,
      profitMargin,
      netProfit,
    };
  };

  const preview = calculatePreview();

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Configuración Contable</CardTitle>
            <CardDescription>
              Personaliza los parámetros contables para calcular ganancias, costos y neto
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Esta configuración se aplica a todos los cálculos de ventas. Los valores se guardan localmente en tu navegador.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Porcentaje de Ganancia */}
          <div className="space-y-2">
            <Label htmlFor="profitMargin" className="text-base font-semibold">
              % de Ganancia Deseada
            </Label>
            <Input
              id="profitMargin"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.profitMargin}
              onChange={(e) => handleChange('profitMargin', e.target.value)}
              placeholder="Ej: 30"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Porcentaje de ganancia objetivo sobre las ventas
            </p>
          </div>

          {/* Costos Fijos */}
          <div className="space-y-2">
            <Label htmlFor="fixedCosts" className="text-base font-semibold">
              Costos Fijos (AR$)
            </Label>
            <Input
              id="fixedCosts"
              type="number"
              step="0.01"
              min="0"
              value={formData.fixedCosts}
              onChange={(e) => handleChange('fixedCosts', e.target.value)}
              placeholder="Ej: 50000"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Costos fijos totales (alquiler, servicios, etc.)
            </p>
          </div>

          {/* Costos Variables */}
          <div className="space-y-2">
            <Label htmlFor="variableCostsPercent" className="text-base font-semibold">
              % Costos Variables
            </Label>
            <Input
              id="variableCostsPercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.variableCostsPercent}
              onChange={(e) => handleChange('variableCostsPercent', e.target.value)}
              placeholder="Ej: 15"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Porcentaje de costos variables sobre las ventas
            </p>
          </div>

          {/* Impuestos */}
          <div className="space-y-2">
            <Label htmlFor="taxesPercent" className="text-base font-semibold">
              % Impuestos
            </Label>
            <Input
              id="taxesPercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.taxesPercent}
              onChange={(e) => handleChange('taxesPercent', e.target.value)}
              placeholder="Ej: 21"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Porcentaje de impuestos (IVA, etc.)
            </p>
          </div>

          {/* Comisiones */}
          <div className="space-y-2">
            <Label htmlFor="commissionsPercent" className="text-base font-semibold">
              % Comisiones
            </Label>
            <Input
              id="commissionsPercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.commissionsPercent}
              onChange={(e) => handleChange('commissionsPercent', e.target.value)}
              placeholder="Ej: 5"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Porcentaje de comisiones (vendedores, etc.)
            </p>
          </div>

          {/* Comisión de Plataforma */}
          <div className="space-y-2">
            <Label htmlFor="platformFeePercent" className="text-base font-semibold">
              % Comisión Plataforma
            </Label>
            <Input
              id="platformFeePercent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.platformFeePercent}
              onChange={(e) => handleChange('platformFeePercent', e.target.value)}
              placeholder="Ej: 10"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Porcentaje de comisión de la plataforma
            </p>
          </div>
        </div>

        {/* Preview de Cálculos */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Vista Previa (con ventas de $100,000)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Ingresos Brutos</p>
              <p className="text-lg font-bold text-green-600">
                ${new Intl.NumberFormat('es-AR').format(preview.revenue)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Total Costos</p>
              <p className="text-lg font-bold text-red-600">
                ${new Intl.NumberFormat('es-AR').format(preview.totalCosts)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Ganancia Bruta</p>
              <p className="text-lg font-bold text-blue-600">
                ${new Intl.NumberFormat('es-AR').format(preview.grossProfit)}
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Ganancia Neta</p>
              <p className="text-lg font-bold text-primary">
                ${new Intl.NumberFormat('es-AR').format(preview.netProfit)}
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AccountingConfig;

