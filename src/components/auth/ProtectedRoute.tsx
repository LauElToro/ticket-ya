import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireOrganizer?: boolean;
  requireVendedor?: boolean;
  requirePortero?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin, 
  requireOrganizer,
  requireVendedor,
  requirePortero 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, isOrganizer, isVendedor, isPortero } = useAuth();

  // Mostrar loading mientras se valida la sesión
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireOrganizer && !isOrganizer) {
    return <Navigate to="/" replace />;
  }

  if (requireVendedor && !isVendedor) {
    return <Navigate to="/" replace />;
  }

  if (requirePortero && !isPortero) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

