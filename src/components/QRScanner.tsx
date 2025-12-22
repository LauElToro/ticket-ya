import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X, Loader2, Camera, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  title?: string;
  description?: string;
}

export const QRScanner = ({ 
  open, 
  onClose, 
  onScanSuccess, 
  onScanError,
  title = 'Escanear QR',
  description = 'Apunta la cámara hacia el código QR'
}: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerId = 'qr-scanner';

  useEffect(() => {
    if (open && !scannerRef.current) {
      startScanning();
    } else if (!open && scannerRef.current) {
      stopScanning();
    }

    return () => {
      stopScanning();
    };
  }, [open]);

  const startScanning = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' }, // Usar cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // QR escaneado exitosamente
          onScanSuccess(decodedText);
          stopScanning();
          onClose();
        },
        (errorMessage) => {
          // Ignorar errores de escaneo (solo mostrar si es crítico)
          if (errorMessage.includes('NotFoundException')) {
            // No se encontró QR, continuar escaneando
            return;
          }
        }
      );
    } catch (err: any) {
      console.error('Error iniciando escáner:', err);
      setError(err.message || 'Error al acceder a la cámara');
      setIsScanning(false);
      if (onScanError) {
        onScanError(err.message);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error deteniendo escáner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={startScanning}
                >
                  Reintentar
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <div
              id={scannerId}
              className="w-full rounded-lg overflow-hidden bg-black"
              style={{ minHeight: '300px' }}
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Escaneando...</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            {!isScanning && !error && (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Iniciar cámara
              </Button>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Asegurate de tener permisos de cámara activados
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

