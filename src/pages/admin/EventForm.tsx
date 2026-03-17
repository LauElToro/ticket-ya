import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi, eventsApi, uploadApi } from '@/lib/api';
import { getEventImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ArrowLeft, Upload, MapPin, Image as ImageIcon, Calendar, Clock, Building2, MapPin as MapPinIcon, Ticket, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// Función helper para generar horas en intervalos de 15 minutos (00:00, 00:15, 00:30, 00:45, ...)
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

// Función helper para obtener la fecha mínima (hoy)
const getMinDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Función helper para redondear hora a intervalo de 15 minutos
const roundToNearest15Minutes = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const roundedMinutes = Math.round(minutes / 15) * 15;
  if (roundedMinutes >= 60) {
    return `${(hours + 1).toString().padStart(2, '0')}:00`;
  }
  return `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
};

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  
  const timeOptions = generateTimeOptions();

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    date: '',
    time: '',
    venue: '',
    address: '',
    city: '',
    image: '',
    latitude: '',
    longitude: '',
    isPublic: true, // Por defecto público
    authorizationCode: '',
    bannerTop: '',
    bannerEmail: '',
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageFileInfo, setImageFileInfo] = useState<{ size: number; dimensions?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerTopRef = useRef<HTMLInputElement>(null);
  const bannerEmailRef = useRef<HTMLInputElement>(null);
  const [isUploadingBannerTop, setIsUploadingBannerTop] = useState(false);
  const [isUploadingBannerEmail, setIsUploadingBannerEmail] = useState(false);

  // Cargar evento si es edición
  const { data: eventData, isLoading: isLoadingEvent, error: eventError } = useQuery({
    queryKey: ['admin-event', id],
    queryFn: () => adminApi.getEventById(id!),
    enabled: isEdit && !!id,
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Cargar datos del evento cuando se reciben
  useEffect(() => {
    if (!eventData?.data || !isEdit) return;
    
    const event = eventData.data;
    console.log('Cargando evento para edición:', event);
    
    // Formatear fecha para el input date
    let formattedDate = '';
    if (event.date) {
      try {
        const eventDate = new Date(event.date);
        if (!isNaN(eventDate.getTime())) {
          formattedDate = eventDate.toISOString().split('T')[0];
        }
      } catch (e) {
        console.error('Error formateando fecha:', e);
      }
    }

    setFormData({
      title: event.title || '',
      subtitle: event.subtitle || '',
      description: event.description || '',
      category: event.category || '',
      date: formattedDate,
      time: event.time || '',
      venue: event.venue || '',
      address: event.address || '',
      city: event.city || '',
      image: event.image || '',
      latitude: event.latitude ? String(event.latitude) : '',
      longitude: event.longitude ? String(event.longitude) : '',
      isPublic: event.isPublic !== undefined ? event.isPublic : true,
      authorizationCode: event.authorizationCode || '',
      bannerTop: event.bannerTop || '',
      bannerEmail: event.bannerEmail || '',
    });
    
    // Limpiar información de archivo al cargar evento existente
    setImageFileInfo(null);
    
    // Tipos de entrada y tandas se gestionan en "Editar y administra tus eTickets"
  }, [eventData?.data, isEdit]);

  // Mostrar error si hay problema cargando el evento
  useEffect(() => {
    if (eventError && isEdit) {
      console.error('Error cargando evento:', eventError);
      toast({
        title: 'Error al cargar el evento',
        description: (eventError as any)?.response?.data?.message || (eventError as any)?.message || 'No se pudo cargar la información del evento',
        variant: 'destructive',
      });
    }
  }, [eventError, isEdit, toast]);

  const mutation = useMutation({
    mutationFn: (data: any) => (isEdit ? adminApi.updateEvent(id!, data) : adminApi.createEvent(data)),
    onSuccess: () => {
      toast({
        title: isEdit ? '✅ Evento actualizado' : '✅ Evento creado',
        description: isEdit ? 'El evento se actualizó exitosamente' : 'El evento se creó exitosamente',
      });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      navigate('/admin/events');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Ocurrió un error';
      toast({
        title: '❌ Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'title':
        if (!value.trim()) {
          newErrors.title = 'El título es requerido';
        } else if (value.length < 3) {
          newErrors.title = 'El título debe tener al menos 3 caracteres';
        } else {
          delete newErrors.title;
        }
        break;
      case 'date':
        if (!value) {
          newErrors.date = 'La fecha es requerida';
        } else {
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            newErrors.date = 'La fecha no puede ser anterior a hoy';
          } else {
            delete newErrors.date;
          }
        }
        break;
      case 'time':
        if (!value) {
          newErrors.time = 'La hora es requerida';
        } else {
          delete newErrors.time;
        }
        break;
      case 'venue':
        if (!value.trim()) {
          newErrors.venue = 'El lugar es requerido';
        } else {
          delete newErrors.venue;
        }
        break;
      case 'city':
        if (!value.trim()) {
          newErrors.city = 'La ciudad es requerida';
        } else {
          delete newErrors.city;
        }
        break;
      case 'category':
        if (!value) {
          newErrors.category = 'La categoría es requerida';
        } else {
          delete newErrors.category;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos requeridos
    validateField('title', formData.title);
    validateField('date', formData.date);
    validateField('time', formData.time);
    validateField('venue', formData.venue);
    validateField('city', formData.city);
    validateField('category', formData.category);

    // Verificar si hay errores
    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario',
        variant: 'destructive',
      });
      return;
    }

    const eventPayload = {
      ...formData,
      ticketTypes: [],
      tandas: [],
    };

    mutation.mutate(eventPayload);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Tipo de archivo inválido',
        description: 'Solo se permiten archivos de imagen (JPG, PNG, WEBP, GIF)',
        variant: 'destructive',
      });
      return;
    }

    // Obtener dimensiones de la imagen
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      setImageFileInfo({
        size: file.size,
        dimensions: `${img.width} x ${img.height}px`
      });
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Archivo muy grande',
        description: 'La imagen no debe superar los 5MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await uploadApi.uploadImage(file);
      if (response.success) {
        setFormData({ ...formData, image: response.data.url });
        toast({
          title: '✅ Imagen subida',
          description: 'La imagen se subió correctamente',
        });
        // Mantener la información del archivo después de subir
      }
    } catch (error: any) {
      toast({
        title: 'Error al subir imagen',
        description: error.message || 'Ocurrió un error al subir la imagen',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'bannerTop' | 'bannerEmail') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Solo imágenes (JPG, PNG)', variant: 'destructive' });
      return;
    }
    if (file.size > 1024 * 1024) {
      toast({ title: 'Máximo 1 MB', variant: 'destructive' });
      return;
    }
    if (field === 'bannerTop') setIsUploadingBannerTop(true);
    else setIsUploadingBannerEmail(true);
    try {
      const response = await uploadApi.uploadImage(file);
      if (response.success) {
        setFormData((prev) => ({ ...prev, [field]: response.data.url }));
        toast({ title: 'Banner subido', description: 'Guardá los cambios para aplicar.' });
      }
    } catch (err: any) {
      toast({ title: 'Error al subir', description: err?.message, variant: 'destructive' });
    } finally {
      if (field === 'bannerTop') {
        setIsUploadingBannerTop(false);
        bannerTopRef.current && (bannerTopRef.current.value = '');
      } else {
        setIsUploadingBannerEmail(false);
        bannerEmailRef.current && (bannerEmailRef.current.value = '');
      }
    }
  };

  const getGoogleMapsSearchUrl = () => {
    if (formData.address) {
      const encodedAddress = encodeURIComponent(formData.address);
      return `https://www.google.com/maps?q=${encodedAddress}&output=embed`;
    } else if (formData.latitude && formData.longitude) {
      return `https://www.google.com/maps?q=${formData.latitude},${formData.longitude}&output=embed`;
    } else {
      return `https://www.google.com/maps?q=Buenos+Aires&output=embed`;
    }
  };

  const categories = ['Música', 'Teatro', 'Stand Up', 'Fiestas', 'Deportes', 'Festival', 'Otro'];

  const isFormValid = formData.title && formData.date && formData.time && formData.venue && formData.city && formData.category;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Header mejorado */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/admin/events')}
              className="mb-4 hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Eventos
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{isEdit ? 'Editar Evento' : 'Crear Nuevo Evento'}</h1>
                <p className="text-muted-foreground mt-1">
                  {isEdit ? 'Modifica la información del evento' : 'Completa todos los campos para crear tu evento'}
                </p>
              </div>
            </div>
          </div>

          {isLoadingEvent ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Cargando información del evento...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información básica */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Ticket className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Información Básica</CardTitle>
                      <CardDescription>Datos principales del evento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                      Título del Evento *
                      {formData.title && formData.title.length >= 3 && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        validateField('title', e.target.value);
                      }}
                      onBlur={(e) => validateField('title', e.target.value)}
                      placeholder="Ej: Festival de Música Rock 2024"
                      className={`mt-2 h-11 ${errors.title ? 'border-destructive' : ''}`}
                      disabled={mutation.isPending}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.title}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="subtitle" className="text-base font-semibold">Subtítulo</Label>
                      <Input
                        id="subtitle"
                        value={formData.subtitle}
                        onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                        placeholder="Ej: La mejor música en vivo"
                        className="mt-2 h-11"
                        disabled={mutation.isPending}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category" className="text-base font-semibold flex items-center gap-2">
                        Categoría *
                        {formData.category && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          validateField('category', e.target.value);
                        }}
                        onBlur={(e) => validateField('category', e.target.value)}
                        className={`w-full h-11 px-3 rounded-lg border border-input bg-background mt-2 ${errors.category ? 'border-destructive' : ''}`}
                        disabled={mutation.isPending}
                      >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-base font-semibold">Descripción</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe tu evento, artistas invitados, actividades especiales..."
                      rows={5}
                      className="mt-2 resize-none"
                      disabled={mutation.isPending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formData.description.length} caracteres
                    </p>
                  </div>

                  {/* Visibilidad del evento */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Visibilidad del Evento</Label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="isPublic"
                          value="true"
                          checked={formData.isPublic === true}
                          onChange={() => setFormData({ ...formData, isPublic: true })}
                          className="w-4 h-4 text-secondary"
                          disabled={mutation.isPending}
                        />
                        <div className="flex-1">
                          <div className="font-medium">Evento Público</div>
                          <div className="text-sm text-muted-foreground">
                            El evento aparecerá en búsquedas y listados públicos
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="isPublic"
                          value="false"
                          checked={formData.isPublic === false}
                          onChange={() => setFormData({ ...formData, isPublic: false })}
                          className="w-4 h-4 text-secondary"
                          disabled={mutation.isPending}
                        />
                        <div className="flex-1">
                          <div className="font-medium">Evento Privado</div>
                          <div className="text-sm text-muted-foreground">
                            Solo accesible mediante link directo. No aparecerá en búsquedas públicas
                          </div>
                        </div>
                      </label>
                    </div>
                    {eventData?.data && !eventData.data.isPublic && eventData.data.privateLink && (
                      <div className="mt-3 p-3 bg-secondary/10 rounded-lg">
                        <Label className="text-sm font-semibold mb-2 block">Link de acceso privado:</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-background rounded border text-sm">
                            {window.location.origin}/evento/{eventData.data.id}?link={eventData.data.privateLink}
                          </code>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/evento/${eventData.data.id}?link=${eventData.data.privateLink}`
                              );
                              toast({
                                title: 'Link copiado',
                                description: 'El link de acceso privado ha sido copiado al portapapeles',
                              });
                            }}
                          >
                            Copiar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Imagen mejorada */}
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2 mb-2">
                      <ImageIcon className="w-5 h-5" />
                      Imagen del Evento
                    </Label>
                    <div className="space-y-3">
                      {/* Información sobre especificaciones */}
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div className="space-y-2 text-sm">
                            <p className="font-semibold text-foreground">Especificaciones recomendadas:</p>
                            <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                              <li><strong>Tamaño:</strong> 1920 x 1080px (16:9) o superior</li>
                              <li><strong>Peso máximo:</strong> 5MB</li>
                              <li><strong>Formato:</strong> JPG, PNG, WEBP o GIF</li>
                              <li><strong>Calidad:</strong> Alta resolución para mejor visualización en banners</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 Las imágenes de alta calidad mejoran la experiencia visual en los banners del sitio
                            </p>
                          </div>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={mutation.isPending || isUploadingImage}
                        className="hidden"
                        id="image-upload"
                      />
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={mutation.isPending || isUploadingImage}
                          className="h-11"
                        >
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              {formData.image ? 'Cambiar Imagen' : 'Subir Imagen'}
                            </>
                          )}
                        </Button>
                        {formData.image && (
                          <span className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Imagen cargada
                          </span>
                        )}
                      </div>
                      {/* Información del archivo seleccionado */}
                      {imageFileInfo && (
                        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                          <div className="flex items-center gap-2 text-sm">
                            <Info className="w-4 h-4 text-secondary" />
                            <span className="font-medium">Archivo seleccionado:</span>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                            {imageFileInfo.dimensions && (
                              <p><strong>Tamaño:</strong> {imageFileInfo.dimensions}</p>
                            )}
                            <p><strong>Peso:</strong> {(imageFileInfo.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                      )}
                      {formData.image && (
                        <div className="mt-3 relative group">
                          <img
                            src={getEventImageUrl(formData.image)}
                            alt="Preview"
                            className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-border shadow-md"
                            loading="eager"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Solo al editar: más fotos, banner superior, banner correo, código de autorización */}
              {isEdit && (
                <Card className="border-2 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">Imágenes y código de autorización</CardTitle>
                    <CardDescription>Banner superior, banner de correo y código que se genera al crear el evento.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold">Imagen principal del evento</Label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        La imagen debe ser 800×800 px (se redimensiona si hace falta). Máx. 4 MB. Si no agregás una, el evento no aparecerá en la página principal hasta tenerla.
                      </p>
                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={mutation.isPending || isUploadingImage}
                        >
                          {isUploadingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                          {formData.image ? 'Cambiar imagen' : 'Seleccionar archivo'}
                        </Button>
                        <span className="text-sm text-muted-foreground">{formData.image ? 'Imagen cargada' : 'ningún archivo seleccionado'}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Banner superior</Label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        Cambiar banner superior: 725×300 px (se redimensiona). Máx. 1 MB.
                      </p>
                      <input ref={bannerTopRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerUpload(e, 'bannerTop')} />
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={() => bannerTopRef.current?.click()} disabled={mutation.isPending || isUploadingBannerTop}>
                          {isUploadingBannerTop ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Seleccionar archivo
                        </Button>
                        <span className="text-sm text-muted-foreground">{formData.bannerTop ? 'Banner cargado' : 'ningún archivo seleccionado'}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Banner correo</Label>
                      <p className="text-xs text-muted-foreground mt-1 mb-2">
                        Cambiar banner correo: ancho 650 px (el alto es irrelevante). Máx. 1 MB.
                      </p>
                      <input ref={bannerEmailRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleBannerUpload(e, 'bannerEmail')} />
                      <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={() => bannerEmailRef.current?.click()} disabled={mutation.isPending || isUploadingBannerEmail}>
                          {isUploadingBannerEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Seleccionar archivo
                        </Button>
                        <span className="text-sm text-muted-foreground">{formData.bannerEmail ? 'Banner cargado' : 'ningún archivo seleccionado'}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-base font-semibold">Código de autorización</Label>
                      <p className="text-xs text-muted-foreground mt-1">Se genera al crear el evento. Podés editarlo si lo necesitás.</p>
                      <Input
                        value={formData.authorizationCode}
                        onChange={(e) => setFormData({ ...formData, authorizationCode: e.target.value })}
                        placeholder="Ej: 5088"
                        className="mt-2 max-w-[140px] font-mono"
                        disabled={mutation.isPending}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fecha y lugar */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <MapPinIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Fecha y Lugar</CardTitle>
                      <CardDescription>Cuándo y dónde se realizará el evento</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-base font-semibold flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Fecha del Evento *
                        {formData.date && !errors.date && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                        )}
                      </Label>
                      <div className="relative">
                        <Input
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => {
                            setFormData({ ...formData, date: e.target.value });
                            validateField('date', e.target.value);
                          }}
                          onBlur={(e) => validateField('date', e.target.value)}
                          min={getMinDate()}
                          className={`h-11 pl-4 pr-4 text-base ${errors.date ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-blue-500'}`}
                          required
                          disabled={mutation.isPending}
                        />
                      </div>
                      {errors.date && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.date}
                        </p>
                      )}
                      {formData.date && !errors.date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Solo se permiten fechas desde hoy en adelante
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time" className="text-base font-semibold flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/30">
                          <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        Hora del Evento *
                        {formData.time && !errors.time && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                        )}
                      </Label>
                      <div className="relative">
                        <select
                          id="time"
                          value={formData.time}
                          onChange={(e) => {
                            const roundedTime = roundToNearest15Minutes(e.target.value);
                            setFormData({ ...formData, time: roundedTime });
                            validateField('time', roundedTime);
                          }}
                          onBlur={(e) => validateField('time', e.target.value)}
                          className={`h-11 w-full rounded-md border bg-background px-4 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 9L1 4h10z'/%3E%3C/svg%3E")] bg-[length:12px] bg-[right_12px_center] bg-no-repeat pr-10 ${errors.time ? 'border-destructive focus-visible:ring-destructive' : 'border-input focus-visible:ring-purple-500'}`}
                          required
                          disabled={mutation.isPending}
                        >
                          <option value="">Seleccionar hora</option>
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.time && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.time}
                        </p>
                      )}
                      {formData.time && !errors.time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Horarios disponibles en intervalos de 5 minutos
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="venue" className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Lugar/Venue *
                      {formData.venue && formData.venue.trim() && !errors.venue && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </Label>
                    <Input
                      id="venue"
                      value={formData.venue}
                      onChange={(e) => {
                        setFormData({ ...formData, venue: e.target.value });
                        validateField('venue', e.target.value);
                      }}
                      onBlur={(e) => validateField('venue', e.target.value)}
                      placeholder="Ej: Estadio Luna Park"
                      className={`mt-2 h-11 ${errors.venue ? 'border-destructive' : ''}`}
                      required
                      disabled={mutation.isPending}
                    />
                    {errors.venue && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.venue}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Dirección
                      </Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Ej: Av. Corrientes 1234, CABA"
                        className="mt-2 h-11"
                        disabled={mutation.isPending}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        El mapa se actualizará automáticamente
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-base font-semibold">
                        Ciudad *
                        {formData.city && formData.city.trim() && !errors.city && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 inline-block ml-2" />
                        )}
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => {
                          setFormData({ ...formData, city: e.target.value });
                          validateField('city', e.target.value);
                        }}
                        onBlur={(e) => validateField('city', e.target.value)}
                        placeholder="Ej: Buenos Aires"
                        className={`mt-2 h-11 ${errors.city ? 'border-destructive' : ''}`}
                        required
                        disabled={mutation.isPending}
                      />
                      {errors.city && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.city}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Mapa */}
                  {formData.address && (
                    <div className="mt-4">
                      <Label className="text-base font-semibold mb-2 block">Vista Previa del Mapa</Label>
                      <div className="w-full h-64 rounded-lg border-2 border-border overflow-hidden shadow-md">
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={getGoogleMapsSearchUrl()}
                          title="Ubicación del evento"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Botones de acción */}
              <div className="flex gap-4 pt-4 sticky bottom-0 bg-background/95 backdrop-blur-sm pb-4 border-t pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/admin/events')}
                  className="flex-1 h-12"
                  disabled={mutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={mutation.isPending || !isFormValid}
                  className="flex-1 h-12 text-base font-semibold"
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isEdit ? 'Guardando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      {isEdit ? '💾 Guardar Cambios' : '✨ Crear Evento'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventForm;
