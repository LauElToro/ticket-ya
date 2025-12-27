import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, api } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ORGANIZER' | 'ADMIN' | 'VALIDATOR' | 'VENDEDOR' | 'PORTERO';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; dni: string; phone?: string }) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isOrganizer: boolean;
  isVendedor: boolean;
  isPortero: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Recuperar token y refreshToken del localStorage
    const storedToken = localStorage.getItem('token');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('user');
    
    // Si hay refreshToken pero no token, intentar renovar
    if (storedRefreshToken && !storedToken) {
      authApi.refresh(storedRefreshToken)
        .then((response) => {
          if (response.success && response.data?.token) {
            const newToken = response.data.token;
            setToken(newToken);
            api.setToken(newToken);
            // Guardar el nuevo token
            localStorage.setItem('token', newToken);
            
            // Obtener datos del usuario
            return authApi.getMe();
          } else {
            throw new Error('No se pudo renovar el token');
          }
        })
        .then((response) => {
          if (response?.success && response?.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        })
        .catch(() => {
          // Si falla la renovación, limpiar todo
          setToken(null);
          setUser(null);
          api.setToken(null);
          api.setRefreshToken(null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else if (storedToken) {
      setToken(storedToken);
      api.setToken(storedToken);
      
      // Si hay refreshToken, guardarlo en el api client
      if (storedRefreshToken) {
        api.setRefreshToken(storedRefreshToken);
      }
      
      // Si hay usuario guardado, usarlo temporalmente mientras validamos
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
      
      // Validar el token y obtener datos actualizados del usuario
      authApi.getMe()
        .then((response) => {
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          } else {
            // Si no hay datos pero hay refreshToken, intentar renovar
            if (storedRefreshToken) {
              return authApi.refresh(storedRefreshToken);
            }
            throw new Error('Token inválido');
          }
        })
        .then((response) => {
          // Si se renovó el token
          if (response?.success && response?.data?.token) {
            const newToken = response.data.token;
            setToken(newToken);
            api.setToken(newToken);
            localStorage.setItem('token', newToken);
            return authApi.getMe();
          }
        })
        .then((response) => {
          if (response?.success && response?.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        })
        .catch(() => {
          // Si falla, intentar renovar con refreshToken si existe
          if (storedRefreshToken) {
            authApi.refresh(storedRefreshToken)
              .then((refreshResponse) => {
                if (refreshResponse.success && refreshResponse.data?.token) {
                  const newToken = refreshResponse.data.token;
                  setToken(newToken);
                  api.setToken(newToken);
                  localStorage.setItem('token', newToken);
                  return authApi.getMe();
                }
              })
              .then((meResponse) => {
                if (meResponse?.success && meResponse?.data) {
                  setUser(meResponse.data);
                  localStorage.setItem('user', JSON.stringify(meResponse.data));
                }
              })
              .catch(() => {
                // Si todo falla, limpiar
                setToken(null);
                setUser(null);
                api.setToken(null);
                api.setRefreshToken(null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
              })
              .finally(() => {
                setIsLoading(false);
              });
          } else {
            // Si no hay refreshToken, limpiar la sesión
            setToken(null);
            setUser(null);
            api.setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsLoading(false);
          }
        })
        .finally(() => {
          if (!storedRefreshToken) {
            setIsLoading(false);
          }
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data) {
        const { token: newToken, refreshToken, user: userData } = response.data;
        setToken(newToken);
        setUser(userData);
        api.setToken(newToken);
        api.setRefreshToken(refreshToken);
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: { email: string; password: string; name: string; dni: string; phone?: string }) => {
    try {
      await authApi.register(data);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    api.setToken(null);
    api.setRefreshToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        isOrganizer: user?.role === 'ORGANIZER' || user?.role === 'ADMIN',
        isVendedor: user?.role === 'VENDEDOR',
        isPortero: user?.role === 'PORTERO',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

