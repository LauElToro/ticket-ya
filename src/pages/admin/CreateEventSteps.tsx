import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi, uploadApi } from '@/lib/api';
import { getEventImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import {
  Loader2,
  ArrowLeft,
  Upload,
  MapPin,
  Image as ImageIcon,
  Calendar,
  Clock,
  Building2,
  Users,
  Radio,
  Wine,
  Wifi,
  AlertCircle,
  CheckCircle2,
  Ticket,
} from 'lucide-react';

const EVENT_MODES = [
  { value: 'PRESENCIAL', label: 'Evento Presencial', icon: Users },
  { value: 'STREAMING', label: 'Evento streaming', icon: Radio },
  { value: 'MIXTO', label: 'Evento mixto', icon: Wifi },
  { value: 'CARTA_CONSUMO', label: 'Carta de consumo', icon: Wine },
] as const;

const EVENT_TYPES = [
  { value: 'PUBLICO', label: 'Público' },
  { value: 'PRIVADO', label: 'Privado' },
  { value: 'OCULTO', label: 'Oculto' },
  { value: 'INACTIVO', label: 'Inactivo' },
] as const;

const MIN_AGE_OPTIONS = [10, 12, 14, 16, 18, 21];

const generateTimeOptions = () => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
};

const getMinDate = () => new Date().toISOString().split('T')[0];

export type StepFormData = {
  eventMode: string;
  title: string;
  eventType: string;
  description: string;
  image: string;
  ageRestriction: boolean;
  minAge: number;
  acceptTerms: boolean;
  country: string;
  region: string;
  city: string;
  address: string;
  venue: string;
  venueName: string;
  date: string;
  time: string;
  endDate: string;
  endTime: string;
};

const initialFormData: StepFormData = {
  eventMode: '',
  title: '',
  eventType: 'PUBLICO',
  description: '',
  image: '',
  ageRestriction: false,
  minAge: 18,
  acceptTerms: false,
  country: 'Argentina',
  region: '',
  city: '',
  address: '',
  venue: '',
  venueName: '',
  date: '',
  time: '',
  endDate: '',
  endTime: '',
};

const TOTAL_STEPS = 4; // 0: tipo evento, 1: info+imagen+restricciones, 2: ubicación, 3: fecha/hora

const CreateEventSteps = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<StepFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const timeOptions = generateTimeOptions();

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.createEvent(data),
    onSuccess: (res: any) => {
      const event = res?.data?.data ?? res?.data;
      const eventId = event?.id;
      toast({
        title: '¡Evento creado de forma exitosa!',
        description: 'Ya podés completar tu evento con entradas, cortesías y más.',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      if (eventId) {
        navigate(`/admin/events/${eventId}/created`, { state: { event } });
      } else {
        navigate('/admin/events');
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error?.response?.data?.message || error?.message || 'No se pudo crear el evento',
        variant: 'destructive',
      });
    },
  });

  const update = (updates: Partial<StepFormData>) => setFormData((prev) => ({ ...prev, ...updates }));

  const validateStep0 = () => {
    if (!formData.eventMode) {
      setErrors({ eventMode: 'Seleccioná el tipo de evento' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!formData.title?.trim()) e.title = 'El título es requerido';
    else if (formData.title.length > 100) e.title = 'Máx. 100 caracteres';
    if (!formData.eventType) e.eventType = 'Seleccioná el tipo de evento';
    if (!formData.acceptTerms) e.acceptTerms = 'Debés aceptar los términos y condiciones';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!formData.city?.trim()) e.city = 'La ciudad es requerida';
    if (!formData.venueName?.trim() && !formData.venue?.trim()) {
      if (!formData.venueName?.trim()) e.venueName = 'Indicá el nombre del lugar del evento';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!formData.date) e.date = 'La fecha de inicio es requerida';
    if (!formData.time) e.time = 'La hora de inicio es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
      toast({
        title: 'Formato inválido',
        description: 'Solo JPG o PNG. Máx. 4 MB.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'Máximo 4 MB',
        variant: 'destructive',
      });
      return;
    }
    setIsUploadingImage(true);
    try {
      const response = await uploadApi.uploadImage(file);
      if (response.success) {
        update({ image: response.data.url });
        toast({ title: 'Imagen subida', description: 'Lista para tu evento.' });
      }
    } catch (err: any) {
      toast({
        title: 'Error al subir',
        description: err?.message || 'No se pudo subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      fileInputRef.current && (fileInputRef.current.value = '');
    }
  };

  const handleSubmit = () => {
    if (!validateStep3()) return;
    const [y, mo, d] = formData.date.split('-');
    const [h, min] = formData.time.split(':');
    const payload = {
      eventMode: formData.eventMode,
      title: formData.title.trim(),
      eventType: formData.eventType,
      description: formData.description?.trim() || null,
      image: formData.image || null,
      ageRestriction: formData.ageRestriction,
      minAge: formData.ageRestriction ? formData.minAge : null,
      category: 'Otro',
      venue: formData.venueName?.trim() || formData.venue?.trim() || formData.city || 'Sin especificar',
      address: formData.address?.trim() || null,
      city: formData.city?.trim(),
      region: formData.region?.trim() || null,
      country: formData.country?.trim() || null,
      date: formData.date,
      time: formData.time,
      endDate: formData.endDate || formData.date,
      endTime: formData.endTime || formData.time,
      ticketTypes: [],
      tandas: [],
    };
    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/events')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Eventos
          </Button>

          <div className="mb-6">
            <h1 className="text-2xl font-bold">Crear evento</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Paso {step + 1} de {TOTAL_STEPS}
            </p>
            <div className="flex gap-1 mt-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          <Card className="border-2 shadow-lg">
            <CardContent className="p-6">
              {/* Paso 0: ¿Qué tipo de evento? */}
              {step === 0 && (
                <>
                  <CardTitle className="text-xl mb-1">¿Qué tipo de evento querés crear?</CardTitle>
                  <CardDescription className="mb-6">Elegí la modalidad de tu evento.</CardDescription>
                  <div className="grid grid-cols-2 gap-4">
                    {EVENT_MODES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => update({ eventMode: value })}
                        className={`p-6 rounded-xl border-2 text-left transition-all flex flex-col items-center gap-2 ${
                          formData.eventMode === value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="w-8 h-8 text-primary" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                  {errors.eventMode && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.eventMode}
                    </p>
                  )}
                </>
              )}

              {/* Paso 1: Información básica + complementaria + imagen + restricciones */}
              {step === 1 && (
                <>
                  <CardTitle className="text-xl mb-1">Información básica</CardTitle>
                  <CardDescription className="mb-4">
                    Utilizá un título claro que describa tu evento.
                  </CardDescription>
                  <div className="space-y-4">
                    <div>
                      <Label>Título del evento *</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => update({ title: e.target.value })}
                        placeholder="Título del evento"
                        maxLength={100}
                        className={`mt-1 ${errors.title ? 'border-destructive' : ''}`}
                      />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Máx. 100 caracteres. {formData.title.length}/100
                      </p>
                      {errors.title && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Tipo del evento *</Label>
                      <select
                        value={formData.eventType}
                        onChange={(e) => update({ eventType: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
                      >
                        {EVENT_TYPES.map(({ value, label }) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        * Los eventos privados no se publican en el sitio y podés administrar entradas con nuestra plataforma.
                      </p>
                    </div>
                    <div>
                      <Label>Información complementaria</Label>
                      <CardDescription className="mb-2">
                        Descripción: beneficios, qué podrán hacer y disfrutar los invitados.
                      </CardDescription>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => update({ description: e.target.value })}
                        placeholder="Descripción del evento (opcional)"
                        rows={4}
                        className="resize-none"
                      />
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Imagen del evento
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                        Tamaño: 800×800 — Peso máx: 4 MB — Formato: JPG, PNG
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="step1-image"
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Seleccionar archivo
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {formData.image ? (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              Imagen cargada
                            </span>
                          ) : (
                            'ningún archivo seleccionado'
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Si no agregás imagen, el evento se creará pero no aparecerá en la página principal hasta tener una. Recomendamos cargarla.
                      </p>
                    </div>
                    <div>
                      <Label className="font-semibold">Restricciones</Label>
                      <div className="space-y-3 mt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ageRestriction}
                            onChange={(e) => update({ ageRestriction: e.target.checked })}
                            className="rounded border-input"
                          />
                          <span>Habilitar restricción de edad</span>
                        </label>
                        {formData.ageRestriction && (
                          <div className="pl-6">
                            <Label className="text-sm">Edad mínima (años)</Label>
                            <select
                              value={formData.minAge}
                              onChange={(e) => update({ minAge: Number(e.target.value) })}
                              className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1 max-w-[120px]"
                            >
                              {MIN_AGE_OPTIONS.map((age) => (
                                <option key={age} value={age}>
                                  {age} años
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={(e) => update({ acceptTerms: e.target.checked })}
                            className="rounded border-input"
                          />
                          <span>Acepto términos y condiciones *</span>
                        </label>
                        {errors.acceptTerms && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {errors.acceptTerms}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Paso 2: Localización */}
              {step === 2 && (
                <>
                  <CardTitle className="text-xl mb-1">¿Dónde se realizará tu evento?</CardTitle>
                  <CardDescription className="mb-4">Localización y lugar.</CardDescription>
                  <div className="space-y-4">
                    <div>
                      <Label>País</Label>
                      <select
                        value={formData.country}
                        onChange={(e) => update({ country: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
                      >
                        <option value="Argentina">Argentina</option>
                        <option value="Chile">Chile</option>
                        <option value="Uruguay">Uruguay</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <Label>Región / Provincia</Label>
                      <Input
                        value={formData.region}
                        onChange={(e) => update({ region: e.target.value })}
                        placeholder="Ej: Buenos Aires, CABA"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Ciudad / Comuna *</Label>
                      <Input
                        value={formData.city}
                        onChange={(e) => update({ city: e.target.value })}
                        placeholder="Ciudad o comuna"
                        className={`mt-1 ${errors.city ? 'border-destructive' : ''}`}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.city}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>Dirección</Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => update({ address: e.target.value })}
                        placeholder="Ej: Av. Corrientes 1234"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Venue (opcional)</Label>
                      <Input
                        value={formData.venue}
                        onChange={(e) => update({ venue: e.target.value })}
                        placeholder="Venue"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Para usar el venue primero seleccioná el país.
                      </p>
                    </div>
                    <div>
                      <Label>Espacio / Lugar del evento *</Label>
                      <p className="text-xs text-muted-foreground mb-1">
                        Nombre del venue o lugar. Ej: Teatro Caupolicán.
                      </p>
                      <Input
                        value={formData.venueName}
                        onChange={(e) => update({ venueName: e.target.value })}
                        placeholder="Ej: Teatro Caupolicán"
                        className={`mt-1 ${errors.venueName ? 'border-destructive' : ''}`}
                      />
                      {errors.venueName && (
                        <p className="text-sm text-destructive flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.venueName}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Paso 3: Fecha y hora */}
              {step === 3 && (
                <>
                  <CardTitle className="text-xl mb-1">Inicio y término del evento</CardTitle>
                  <CardDescription className="mb-4">Día y hora de inicio y fin.</CardDescription>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Día (inicio) *</Label>
                        <Input
                          type="date"
                          value={formData.date}
                          onChange={(e) => update({ date: e.target.value })}
                          min={getMinDate()}
                          className={`mt-1 ${errors.date ? 'border-destructive' : ''}`}
                        />
                        {errors.date && (
                          <p className="text-sm text-destructive mt-1">{errors.date}</p>
                        )}
                      </div>
                      <div>
                        <Label>Hora inicio *</Label>
                        <select
                          value={formData.time}
                          onChange={(e) => update({ time: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
                        >
                          <option value="">Seleccionar</option>
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                        {errors.time && (
                          <p className="text-sm text-destructive mt-1">{errors.time}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Día término</Label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => update({ endDate: e.target.value })}
                          min={formData.date || getMinDate()}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Hora término</Label>
                        <select
                          value={formData.endTime}
                          onChange={(e) => update({ endTime: e.target.value })}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background mt-1"
                        >
                          <option value="">Seleccionar</option>
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Navegación */}
              <div className="flex gap-3 mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goPrev}
                  disabled={step === 0 || mutation.isPending}
                  className="flex-1"
                >
                  Anterior
                </Button>
                {step < TOTAL_STEPS - 1 ? (
                  <Button type="button" onClick={goNext} className="flex-1">
                    Siguiente
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={mutation.isPending}
                    className="flex-1 bg-primary"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Creando...
                      </>
                    ) : (
                      '¡Crear evento!'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEventSteps;
