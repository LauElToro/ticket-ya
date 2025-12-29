import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Si ya está autenticado, redirigir según el rol
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      let redirectPath = '/';
      if (user.role === 'VENDEDOR') {
        redirectPath = '/vendedor/dashboard';
      } else if (user.role === 'PORTERO') {
        redirectPath = '/portero/scan';
      } else if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
        redirectPath = '/admin/dashboard';
      } else {
        redirectPath = (location.state as any)?.from || '/';
      }
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Mostrar loading mientras se valida la sesión
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      toast({ title: 'Sesión iniciada exitosamente' });
      
      // Obtener el usuario del contexto después del login
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Redirigir según el rol
      let redirectPath = '/';
      if (user.role === 'VENDEDOR') {
        redirectPath = '/vendedor/dashboard';
      } else if (user.role === 'PORTERO') {
        redirectPath = '/portero/scan';
      } else if (user.role === 'ADMIN' || user.role === 'ORGANIZER') {
        redirectPath = '/admin/dashboard';
      } else {
        // Redirigir a la página de origen si existe, o al inicio
        const from = (location.state as any)?.from || '/';
        redirectPath = from;
      }
      
      navigate(redirectPath);
    } catch (error: any) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message || 'Credenciales inválidas',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Ingresa a tu cuenta para continuar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar Sesión'
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <span className="text-muted-foreground">¿No tenés cuenta? </span>
                <Link to="/register" className="text-secondary hover:underline">
                  Registrate
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
