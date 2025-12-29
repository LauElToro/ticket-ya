import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from '@/hooks/use-toast';
import { Loader2, Gift, CheckCircle2, AlertCircle } from 'lucide-react';

const CompleteRegistration = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { setUser, setToken } = useAuth();

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    dni: '',
    phone: '',
    name: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Token inválido',
        description: 'El link de registro no es válido o ha expirado',
        variant: 'destructive',
      });
      navigate('/login');
    }
  }, [token, navigate]);

  const completeRegistrationMutation = useMutation({
    mutationFn: (data: any) => authApi.completeGiftRegistration(token!, data),
    onSuccess: (response) => {
      // Guardar tokens y usuario
      const { token: accessToken, refreshToken, user } = response.data;
      setToken(accessToken);
      localStorage.setItem('token', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast({
        title: '✅ Registro completado exitosamente',
        description: 'Ya podés ver tus entradas en "Mis Entradas"',
      });

      // Redirigir a mis entradas
      setTimeout(() => {
        navigate('/mis-entradas');
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: 'Error al completar el registro',
        description: error.message || 'No se pudo completar el registro',
        variant: 'destructive',
      });
    },
  });

  const validateField = (name: string, value: string) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'password':
        if (!value) {
          newErrors.password = 'La contraseña es requerida';
        } else if (value.length < 6) {
          newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (value !== formData.password) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'dni':
        if (!value) {
          newErrors.dni = 'El DNI es requerido';
        } else if (!/^\d{7,8}$/.test(value)) {
          newErrors.dni = 'DNI inválido (7 u 8 dígitos)';
        } else {
          delete newErrors.dni;
        }
        break;
      case 'phone':
        if (!value) {
          newErrors.phone = 'El teléfono es requerido';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'name':
        if (!value) {
          newErrors.name = 'El nombre es requerido';
        } else if (value.length < 2) {
          newErrors.name = 'El nombre debe tener al menos 2 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
    }

    setErrors(newErrors);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar todos los campos
    validateField('password', formData.password);
    validateField('confirmPassword', formData.confirmPassword);
    validateField('dni', formData.dni);
    validateField('phone', formData.phone);
    validateField('name', formData.name);

    if (Object.keys(errors).length > 0 || !formData.password || !formData.dni || !formData.phone || !formData.name) {
      toast({
        title: 'Error de validación',
        description: 'Por favor completa todos los campos correctamente',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Las contraseñas no coinciden',
        variant: 'destructive',
      });
      return;
    }

    completeRegistrationMutation.mutate({
      password: formData.password,
      dni: formData.dni,
      phone: formData.phone,
      name: formData.name,
    });
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="border-2 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-pink-100 dark:bg-pink-900/30 w-fit">
                <Gift className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle className="text-2xl">Completar Registro</CardTitle>
              <CardDescription>
                Te regalaron entradas. Completá tu registro para acceder a ellas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">
                    Nombre completo *
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      validateField('name', e.target.value);
                    }}
                    onBlur={(e) => validateField('name', e.target.value)}
                    placeholder="Juan Pérez"
                    className={`mt-2 h-11 ${errors.name ? 'border-destructive' : ''}`}
                    required
                    disabled={completeRegistrationMutation.isPending}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="dni" className="text-base font-semibold">
                    DNI *
                  </Label>
                  <Input
                    id="dni"
                    type="text"
                    value={formData.dni}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, dni: value });
                      validateField('dni', value);
                    }}
                    onBlur={(e) => validateField('dni', e.target.value)}
                    placeholder="12345678"
                    maxLength={8}
                    className={`mt-2 h-11 ${errors.dni ? 'border-destructive' : ''}`}
                    required
                    disabled={completeRegistrationMutation.isPending}
                  />
                  {errors.dni && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dni}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="text-base font-semibold">
                    Teléfono *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      validateField('phone', e.target.value);
                    }}
                    onBlur={(e) => validateField('phone', e.target.value)}
                    placeholder="11 1234-5678"
                    className={`mt-2 h-11 ${errors.phone ? 'border-destructive' : ''}`}
                    required
                    disabled={completeRegistrationMutation.isPending}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password" className="text-base font-semibold">
                    Contraseña *
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      validateField('password', e.target.value);
                    }}
                    onBlur={(e) => validateField('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={`mt-2 h-11 ${errors.password ? 'border-destructive' : ''}`}
                    required
                    disabled={completeRegistrationMutation.isPending}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-base font-semibold">
                    Confirmar Contraseña *
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      validateField('confirmPassword', e.target.value);
                    }}
                    onBlur={(e) => validateField('confirmPassword', e.target.value)}
                    placeholder="Repetí tu contraseña"
                    className={`mt-2 h-11 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    required
                    disabled={completeRegistrationMutation.isPending}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                  disabled={completeRegistrationMutation.isPending}
                  size="lg"
                >
                  {completeRegistrationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Completando registro...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Completar Registro
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompleteRegistration;

