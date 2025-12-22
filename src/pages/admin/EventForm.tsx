import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { adminApi, eventsApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, ArrowLeft, Upload, MapPin, Image as ImageIcon, Calendar, Clock, Building2, MapPin as MapPinIcon, Ticket, AlertCircle, CheckCircle2 } from 'lucide-react';

interface TicketType {
  id?: string; // ID opcional para tipos existentes
  name: string;
  price: string;
  totalQty: string;
}

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

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
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: '', price: '', totalQty: '' },
  ]);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (eventData?.data && isEdit) {
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
      });
      
      // Cargar tipos de entrada
      if (event.ticketTypes && event.ticketTypes.length > 0) {
        console.log('Cargando tipos de entrada:', event.ticketTypes);
        setTicketTypes(
          event.ticketTypes.map((tt: any) => ({
            id: tt.id, // Incluir ID para identificar tipos existentes
            name: tt.name || '',
            price: String(tt.price || 0),
            totalQty: String(tt.totalQty || 0),
          }))
        );
      } else {
        // Si no hay tipos de entrada, mantener uno vacío
        console.log('No hay tipos de entrada, usando uno vacío');
        setTicketTypes([{ name: '', price: '', totalQty: '' }]);
      }
    }
  }, [eventData, isEdit]);

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
  }, [eventError, isEdit]);

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

    // Validar ticket types
    const validTicketTypes = ticketTypes.filter(
      (tt) => tt.name && tt.price && tt.totalQty && parseFloat(tt.price) > 0 && parseInt(tt.totalQty) > 0
    );

    if (validTicketTypes.length === 0) {
      toast({
        title: 'Error de validación',
        description: 'Debes agregar al menos un tipo de entrada válido',
        variant: 'destructive',
      });
      return;
    }

    // Verificar si hay errores
    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Error de validación',
        description: 'Por favor corrige los errores en el formulario',
        variant: 'destructive',
      });
      return;
    }

    const eventData = {
      ...formData,
      ticketTypes: validTicketTypes.map((tt) => ({
        ...(tt.id && { id: tt.id }), // Incluir ID si existe (para actualización)
        name: tt.name,
        price: parseFloat(tt.price),
        totalQty: parseInt(tt.totalQty),
      })),
    };

    mutation.mutate(eventData);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '', totalQty: '' }]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const updateTicketType = (index: number, field: keyof TicketType, value: string) => {
    const updated = [...ticketTypes];
    updated[index] = { ...updated[index], [field]: value };
    setTicketTypes(updated);
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
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);
      
      const response = await uploadApi.uploadImage(formDataUpload);
      if (response.success) {
        setFormData({ ...formData, image: response.data.url });
        toast({
          title: '✅ Imagen subida',
          description: 'La imagen se subió correctamente',
        });
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

                  {/* Imagen mejorada */}
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2 mb-2">
                      <ImageIcon className="w-5 h-5" />
                      Imagen del Evento
                    </Label>
                    <div className="space-y-3">
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
                      {formData.image && (
                        <div className="mt-3 relative group">
                          <img
                            src={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}${formData.image}`}
                            alt="Preview"
                            className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-border shadow-md"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <div>
                      <Label htmlFor="date" className="text-base font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Fecha *
                        {formData.date && !errors.date && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData({ ...formData, date: e.target.value });
                          validateField('date', e.target.value);
                        }}
                        onBlur={(e) => validateField('date', e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className={`mt-2 h-11 ${errors.date ? 'border-destructive' : ''}`}
                        required
                        disabled={mutation.isPending}
                      />
                      {errors.date && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.date}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="time" className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Hora *
                        {formData.time && !errors.time && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </Label>
                      <Input
                        id="time"
                        type="time"
                        value={formData.time}
                        onChange={(e) => {
                          setFormData({ ...formData, time: e.target.value });
                          validateField('time', e.target.value);
                        }}
                        onBlur={(e) => validateField('time', e.target.value)}
                        className={`mt-2 h-11 ${errors.time ? 'border-destructive' : ''}`}
                        required
                        disabled={mutation.isPending}
                      />
                      {errors.time && (
                        <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.time}
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

              {/* Tipos de entrada */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <Ticket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Tipos de Entrada</CardTitle>
                        <CardDescription>Define los tipos y precios de las entradas</CardDescription>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addTicketType}
                      className="h-9"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Tipo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {ticketTypes.map((tt, index) => {
                    const isValid = tt.name && tt.price && tt.totalQty && parseFloat(tt.price) > 0 && parseInt(tt.totalQty) > 0;
                    return (
                      <div 
                        key={index} 
                        className={`p-5 border-2 rounded-lg transition-all ${
                          isValid ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Tipo {index + 1}</span>
                            {isValid && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          {ticketTypes.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTicketType(index)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Nombre *</Label>
                            <Input
                              value={tt.name}
                              onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                              placeholder="Ej: Campo General"
                              className="mt-1 h-10"
                              disabled={mutation.isPending}
                            />
                          </div>
                          <div>
                            <Label>Precio (AR$) *</Label>
                            <Input
                              type="number"
                              value={tt.price}
                              onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                              placeholder="0"
                              min="0"
                              step="0.01"
                              className="mt-1 h-10"
                              disabled={mutation.isPending}
                            />
                          </div>
                          <div>
                            <Label>Cantidad *</Label>
                            <Input
                              type="number"
                              value={tt.totalQty}
                              onChange={(e) => updateTicketType(index, 'totalQty', e.target.value)}
                              placeholder="0"
                              min="1"
                              className="mt-1 h-10"
                              disabled={mutation.isPending}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
