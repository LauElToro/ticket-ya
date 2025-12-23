import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Html5Qrcode } from 'html5-qrcode';
import { porteroApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, ArrowLeft, Loader2, QrCode, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

const Scan = () => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanResult, setScanResult] = useState<{
    isValid: boolean;
    reason?: string;
    ticket?: any;
  } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scannerId = 'portero-qr-scanner';

  const scanMutation = useMutation({
    mutationFn: (qrCode: string) => porteroApi.scanTicket(qrCode),
    onSuccess: (response) => {
      setIsScanning(false);
      setScanResult(response.data);
      
      if (response.data.isValid) {
        toast({
          title: '✅ Entrada válida',
          description: 'La entrada ha sido escaneada exitosamente.',
        });
      } else {
        toast({
          title: '❌ Entrada inválida',
          description: response.data.reason || 'No se pudo validar la entrada.',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      setIsScanning(false);
      setScanResult({
        isValid: false,
        reason: error.message || 'Error al escanear la entrada',
      });
      toast({
        title: 'Error',
        description: error.message || 'No se pudo escanear la entrada.',
        variant: 'destructive',
      });
    },
  });

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error deteniendo escáner:', err);
      }
      scannerRef.current = null;
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    setIsScanning(true);
    stopScanner();
    
    // Reproducir sonido de éxito (si está disponible)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGW77+OcTgwOUKjk8LZjHAY4kdfyzHksBSR3x/DdkEAKFF606euoVRQKRp/g8r5sIQUrgc7y2Yk2CBhlu+/jnE4MDlCo5PC2YxwGOJHX8sx5LAUkd8fw3ZBAC');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignorar errores si no se puede reproducir
    } catch (e) {
      // Ignorar errores de audio
    }
    scanMutation.mutate(decodedText);
  };

  // Inicializar scanner cuando el componente se monta o cuando se reinicia
  useEffect(() => {
    const startScanner = async () => {
      // Limpiar scanner anterior si existe
      await stopScanner();
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerId);
      }

      try {
        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // QR escaneado exitosamente
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignorar errores de escaneo continuo
          }
        );
        setIsInitializing(false);
      } catch (err: any) {
        console.error('Error iniciando escáner:', err);
        setIsInitializing(false);
        toast({
          title: 'Error',
          description: 'No se pudo acceder a la cámara. Asegurate de dar permisos.',
          variant: 'destructive',
        });
      }
    };

    if (!scanResult && !isScanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanResult, isScanning]);

  const handleContinue = () => {
    setScanResult(null);
    setIsScanning(false);
    setIsInitializing(true);
  };

  // No usar Header/Footer para mantener la pantalla simple y rápida
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {!scanResult ? (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-black p-6 text-center">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-white" />
                <h1 className="text-2xl font-bold text-white mb-2">Escanear Entrada</h1>
                <p className="text-white/80 text-sm">Apunta la cámara hacia el código QR de la entrada</p>
              </div>
              <div className="relative bg-black">
                {isInitializing ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
                      <p className="text-white">Iniciando cámara...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div id={scannerId} className="w-full"></div>
                    {isScanning && (
                      <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50">
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 animate-spin text-white mx-auto mb-4" />
                          <p className="text-white font-semibold">Validando entrada...</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg m-4 pointer-events-none flex items-center justify-center">
                      <Camera className="w-16 h-16 text-white/30" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
                  scanResult.isValid ? "bg-green-100" : "bg-red-100"
                )}>
                  {scanResult.isValid ? (
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                  ) : (
                    <XCircle className="w-12 h-12 text-red-600" />
                  )}
                </div>

                <div>
                  <h2 className={cn(
                    "text-2xl font-bold mb-2",
                    scanResult.isValid ? "text-green-600" : "text-red-600"
                  )}>
                    {scanResult.isValid ? 'Entrada Aprobada' : 'Entrada Rechazada'}
                  </h2>
                  <p className="text-muted-foreground">
                    {scanResult.reason || (scanResult.isValid ? 'La entrada es válida y ha sido registrada.' : 'La entrada no puede ser utilizada.')}
                  </p>
                </div>

                {scanResult.ticket && (
                  <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Evento:</span>
                      <p className="font-semibold">{scanResult.ticket.event?.title}</p>
                    </div>
                    {scanResult.ticket.owner && (
                      <div>
                        <span className="text-sm text-muted-foreground">Propietario:</span>
                        <p className="font-semibold">{scanResult.ticket.owner.name}</p>
                      </div>
                    )}
                    {scanResult.ticket.scannedAt && (
                      <div>
                        <span className="text-sm text-muted-foreground">Escaneada:</span>
                        <p className="font-semibold">
                          {new Date(scanResult.ticket.scannedAt).toLocaleString('es-AR')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleContinue}
                  className="w-full"
                  size="lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Escanear otra entrada
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Scan;

