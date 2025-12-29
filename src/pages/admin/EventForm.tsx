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
import { Loader2, Plus, Trash2, ArrowLeft, Upload, MapPin, Image as ImageIcon, Calendar, Clock, Building2, MapPin as MapPinIcon, Ticket, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface TandaTicketType {
  name: string; // Nombre del tipo de entrada
  price: string; // Precio en esta tanda
  quantity: string; // Cantidad disponible en esta tanda
}

interface Tanda {
  id?: string; // ID opcional para tandas existentes
  name: string;
  startDate: string;
  endDate: string;
  ticketTypes: TandaTicketType[]; // Tipos de entrada con precios para esta tanda
}

interface TicketType {
  id?: string; // ID opcional para tipos existentes
  name: string;
  totalQty: string; // Cantidad total (suma de todas las tandas)
}

// Función helper para generar horas en intervalos de 5 minutos
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
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

// Función helper para redondear hora a intervalo de 5 minutos
const roundToNearest5Minutes = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const roundedMinutes = Math.round(minutes / 5) * 5;
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
  });

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: '', totalQty: '' },
  ]);

  const [tandas, setTandas] = useState<Tanda[]>([]);

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
    });
    
    // Cargar tipos de entrada
    if (event.ticketTypes && event.ticketTypes.length > 0) {
      console.log('Cargando tipos de entrada:', event.ticketTypes);
      setTicketTypes(
        event.ticketTypes.map((tt: any) => ({
          id: tt.id,
          name: tt.name || '',
          totalQty: String(tt.totalQty || 0),
        }))
      );
    } else {
      setTicketTypes([{ name: '', totalQty: '' }]);
    }

    // Cargar tandas
    if (event.tandas && event.tandas.length > 0) {
      console.log('Cargando tandas:', event.tandas);
      const loadedTandas = event.tandas.map((tanda: any) => {
        console.log('Procesando tanda:', tanda);
        console.log('tandaTicketTypes:', tanda.tandaTicketTypes);
        return {
          id: tanda.id,
          name: tanda.name || '',
          startDate: tanda.startDate ? new Date(tanda.startDate).toISOString().split('T')[0] : '',
          endDate: tanda.endDate ? new Date(tanda.endDate).toISOString().split('T')[0] : '',
          ticketTypes: tanda.tandaTicketTypes?.map((ttt: any) => {
            console.log('Procesando tandaTicketType:', ttt);
            return {
              name: ttt.ticketType?.name || '',
              price: String(ttt.price || 0),
              quantity: String(ttt.quantity || 0),
            };
          }) || [],
        };
      });
      console.log('Tandas procesadas:', loadedTandas);
      setTandas(loadedTandas);
    } else {
      console.log('No hay tandas para cargar');
      setTandas([]);
    }
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

    // Validar tipos de entrada
    const validTicketTypes = ticketTypes.filter(
      (tt) => tt.name && tt.totalQty && parseInt(tt.totalQty) > 0
    );

    if (validTicketTypes.length === 0) {
      toast({
        title: 'Error de validación',
        description: 'Debes agregar al menos un tipo de entrada válido',
        variant: 'destructive',
      });
      return;
    }

    // Validar tandas
    if (tandas.length === 0) {
      toast({
        title: 'Error de validación',
        description: 'Debes agregar al menos una tanda',
        variant: 'destructive',
      });
      return;
    }

    for (const tanda of tandas) {
      if (!tanda.startDate || !tanda.endDate) {
        toast({
          title: 'Error de validación',
          description: 'Todas las tandas deben tener fecha de inicio y fin',
          variant: 'destructive',
        });
        return;
      }

      if (tanda.ticketTypes.length === 0) {
        toast({
          title: 'Error de validación',
          description: 'Cada tanda debe tener al menos un tipo de entrada',
          variant: 'destructive',
        });
        return;
      }

      for (const tt of tanda.ticketTypes) {
        if (!tt.price || parseFloat(tt.price) <= 0 || !tt.quantity || parseInt(tt.quantity) <= 0) {
          toast({
            title: 'Error de validación',
            description: 'Todos los tipos de entrada en las tandas deben tener precio y cantidad válidos',
            variant: 'destructive',
          });
          return;
        }
      }
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

    // Calcular totalQty para cada tipo de entrada sumando las cantidades de todas las tandas
    const ticketTypesWithTotals = validTicketTypes.map((tt) => {
      const totalQty = tandas.reduce((sum, tanda) => {
        const tandaType = tanda.ticketTypes.find(t => t.name === tt.name);
        return sum + (tandaType ? parseInt(tandaType.quantity || '0') : 0);
      }, 0);
      return {
        ...(tt.id && { id: tt.id }),
        name: tt.name,
        totalQty: totalQty || parseInt(tt.totalQty),
      };
    });

    const eventData = {
      ...formData,
      ticketTypes: ticketTypesWithTotals,
      tandas: tandas.map((tanda) => ({
        ...(tanda.id && { id: tanda.id }),
        name: tanda.name,
        startDate: tanda.startDate,
        endDate: tanda.endDate,
        ticketTypes: tanda.ticketTypes.map((tt) => ({
          name: tt.name,
          price: parseFloat(tt.price),
          quantity: parseInt(tt.quantity),
        })),
      })),
    };

    mutation.mutate(eventData);
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', totalQty: '' }]);
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

  const addTanda = () => {
    const validTicketTypes = ticketTypes.filter(tt => tt.name && tt.name.trim());
    if (validTicketTypes.length === 0) {
      toast({
        title: 'Error',
        description: 'Primero debes definir al menos un tipo de entrada con nombre',
        variant: 'destructive',
      });
      return;
    }
    const newTanda: Tanda = {
      name: `Tanda ${tandas.length + 1}`,
      startDate: '',
      endDate: '',
      ticketTypes: validTicketTypes.map(tt => ({
        name: tt.name,
        price: '',
        quantity: '',
      })),
    };
    setTandas([...tandas, newTanda]);
  };

  const removeTanda = (index: number) => {
    setTandas(tandas.filter((_, i) => i !== index));
  };

  const updateTanda = (index: number, field: keyof Tanda, value: string) => {
    const updated = [...tandas];
    updated[index] = { ...updated[index], [field]: value };
    setTandas(updated);
  };

  const updateTandaTicketType = (tandaIndex: number, ticketTypeName: string, field: keyof TandaTicketType, value: string) => {
    const updated = [...tandas];
    const tanda = updated[tandaIndex];
    const existingIndex = tanda.ticketTypes.findIndex(t => t.name === ticketTypeName);
    
    if (existingIndex >= 0) {
      // Actualizar existente
      tanda.ticketTypes[existingIndex] = {
        ...tanda.ticketTypes[existingIndex],
        [field]: value,
      };
    } else {
      // Crear nuevo
      tanda.ticketTypes.push({
        name: ticketTypeName,
        price: field === 'price' ? value : '',
        quantity: field === 'quantity' ? value : '',
      });
    }
    
    setTandas(updated);
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
                            const roundedTime = roundToNearest5Minutes(e.target.value);
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
                        <CardDescription>Define los tipos de entrada (General, VIP, etc.)</CardDescription>
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
                    const isValid = tt.name && tt.totalQty && parseInt(tt.totalQty) > 0;
                    // Calcular cantidad total desde las tandas
                    const calculatedTotal = tandas.reduce((sum, tanda) => {
                      const tandaType = tanda.ticketTypes.find(t => t.name === tt.name);
                      return sum + (tandaType ? parseInt(tandaType.quantity || '0') : 0);
                    }, 0);
                    return (
                      <div 
                        key={index} 
                        className={`p-4 border-2 rounded-lg transition-all ${
                          isValid ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10' : 'border-border'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nombre *</Label>
                            <Input
                              value={tt.name}
                              onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                              placeholder="Ej: General, VIP, Mitangrid"
                              className="mt-1 h-10"
                              disabled={mutation.isPending}
                            />
                          </div>
                          <div>
                            <Label>Cantidad Total</Label>
                            <Input
                              type="number"
                              value={calculatedTotal > 0 ? String(calculatedTotal) : tt.totalQty}
                              onChange={(e) => updateTicketType(index, 'totalQty', e.target.value)}
                              placeholder="0"
                              min="1"
                              className="mt-1 h-10"
                              disabled={mutation.isPending || calculatedTotal > 0}
                              title={calculatedTotal > 0 ? "La cantidad se calcula automáticamente desde las tandas" : ""}
                            />
                            {calculatedTotal > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Calculado automáticamente desde las tandas: {calculatedTotal}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Tandas */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Tandas</CardTitle>
                        <CardDescription>Define las tandas con fechas y precios por tipo de entrada</CardDescription>
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addTanda}
                      className="h-9"
                      disabled={ticketTypes.length === 0 || ticketTypes.some(tt => !tt.name)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Tanda
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tandas.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Agregá tandas para definir períodos de venta con diferentes precios por tipo de entrada
                    </p>
                  ) : (
                    tandas.map((tanda, tandaIndex) => (
                      <div key={tandaIndex} className="p-5 border-2 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{tanda.name}</span>
                            {tanda.startDate && tanda.endDate && tanda.ticketTypes.length > 0 && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTanda(tandaIndex)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-sm font-semibold">
                              <Ticket className="w-3.5 h-3.5 text-blue-600" />
                              Nombre de la Tanda
                            </Label>
                            <Input
                              value={tanda.name}
                              onChange={(e) => updateTanda(tandaIndex, 'name', e.target.value)}
                              placeholder="Ej: Tanda 1 - Preventa"
                              className="h-10 text-sm"
                              disabled={mutation.isPending}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-sm font-semibold">
                              <div className="p-1 rounded bg-green-100 dark:bg-green-900/30">
                                <Calendar className="w-3 h-3 text-green-600 dark:text-green-400" />
                              </div>
                              Fecha Inicio *
                            </Label>
                            <Input
                              type="date"
                              value={tanda.startDate}
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                // Validar que no sea anterior a hoy
                                if (selectedDate && selectedDate < getMinDate()) {
                                  toast({
                                    title: 'Fecha inválida',
                                    description: 'La fecha no puede ser anterior a hoy',
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                updateTanda(tandaIndex, 'startDate', selectedDate);
                              }}
                              min={getMinDate()}
                              className="h-10 text-sm"
                              disabled={mutation.isPending}
                              required
                            />
                            {tanda.startDate && tanda.startDate < getMinDate() && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Fecha no puede ser anterior a hoy
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-1.5 text-sm font-semibold">
                              <div className="p-1 rounded bg-red-100 dark:bg-red-900/30">
                                <Calendar className="w-3 h-3 text-red-600 dark:text-red-400" />
                              </div>
                              Fecha Fin *
                            </Label>
                            <Input
                              type="date"
                              value={tanda.endDate}
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                // Validar que no sea anterior a la fecha de inicio
                                if (selectedDate && tanda.startDate && selectedDate < tanda.startDate) {
                                  toast({
                                    title: 'Fecha inválida',
                                    description: 'La fecha de fin no puede ser anterior a la fecha de inicio',
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                // Validar que no sea anterior a hoy
                                if (selectedDate && selectedDate < getMinDate()) {
                                  toast({
                                    title: 'Fecha inválida',
                                    description: 'La fecha no puede ser anterior a hoy',
                                    variant: 'destructive',
                                  });
                                  return;
                                }
                                updateTanda(tandaIndex, 'endDate', selectedDate);
                              }}
                              min={tanda.startDate || getMinDate()}
                              className="h-10 text-sm"
                              disabled={mutation.isPending}
                              required
                            />
                            {tanda.endDate && tanda.startDate && tanda.endDate < tanda.startDate && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Fecha fin debe ser posterior a fecha inicio
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <Label className="text-sm font-semibold mb-3 block">Precios y Cantidades por Tipo de Entrada</Label>
                          <div className="space-y-3">
                            {ticketTypes.filter(tt => tt.name && tt.name.trim()).map((tt, ttIndex) => {
                              const tandaType = tanda.ticketTypes.find(t => t.name === tt.name) || {
                                name: tt.name,
                                price: '',
                                quantity: '',
                              };
                              
                              return (
                                <div key={ttIndex} className="p-3 bg-background rounded-lg border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium">{tt.name}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Precio (AR$) *</Label>
                                      <Input
                                        type="number"
                                        value={tandaType.price}
                                        onChange={(e) => updateTandaTicketType(tandaIndex, tt.name, 'price', e.target.value)}
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        className="h-9"
                                        disabled={mutation.isPending}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Cantidad *</Label>
                                      <Input
                                        type="number"
                                        value={tandaType.quantity}
                                        onChange={(e) => updateTandaTicketType(tandaIndex, tt.name, 'quantity', e.target.value)}
                                        placeholder="0"
                                        min="1"
                                        className="h-9"
                                        disabled={mutation.isPending}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {ticketTypes.filter(tt => tt.name && tt.name.trim()).length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Primero debes definir tipos de entrada con nombre
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
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
