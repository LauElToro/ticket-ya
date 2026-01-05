import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, User, LayoutDashboard, LogOut, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isOrganizer } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/eventos', label: 'Eventos' },
    { href: '/como-funciona', label: 'Cómo funciona' },
    { href: '/ayuda', label: 'Ayuda' },
    { href: '/favoritos', label: 'Favoritos' },
    { href: '/mis-entradas', label: 'Mis entradas' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        // En mobile siempre tiene fondo sólido, en desktop puede ser transparente
        theme === 'dark'
          ? isScrolled
            ? 'bg-background/95 backdrop-blur-md shadow-soft border-border'
            : 'bg-background/95 md:bg-background/80 backdrop-blur-md md:backdrop-blur-sm border-border/50'
          : isScrolled
            ? 'bg-black/95 backdrop-blur-md shadow-soft border-transparent'
            : 'bg-black/95 md:bg-transparent backdrop-blur-md md:backdrop-blur-none border-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo PULSO */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pulso-purple via-pulso-magenta to-pulso-coral flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-pulso-purple/30">
              <span className="text-white font-display font-bold text-xs tracking-tight relative z-10 pulso-brand-text">PULSO</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pulso-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <span className="hidden md:block font-display font-bold text-xl bg-gradient-to-r from-pulso-purple via-pulso-magenta to-pulso-coral bg-clip-text text-transparent pulso-brand-text">
              PULSO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm font-medium transition-colors duration-200 relative',
                  location.pathname === link.href
                    ? 'text-secondary'
                    : theme === 'dark'
                      ? 'text-foreground/80 hover:text-foreground'
                      : isScrolled 
                        ? 'text-white/80 hover:text-white' 
                        : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {link.label}
                {location.pathname === link.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "w-10 h-10 p-0 transition-colors rounded-full",
                theme === 'light' 
                  ? "bg-white/10 hover:bg-white/20" 
                  : "bg-black/20 hover:bg-black/30"
              )}
              title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-white" />
              ) : (
                <Sun className="w-5 h-5 text-white" />
              )}
            </Button>
            {isAuthenticated ? (
              <>
                {isOrganizer && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/admin/dashboard')}
                  >
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                )}
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted">
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user?.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  className={cn(
                    "border-2 transition-colors",
                    theme === 'dark'
                      ? "bg-background text-foreground hover:bg-muted border-border"
                      : "bg-white text-foreground hover:bg-white/90 border-white/20"
                  )}
                >
                  Ingresar
                </Button>
                <Button variant="gradient" size="sm" onClick={() => navigate('/register')}>
                  Registrarse
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={cn(
              "md:hidden p-2 transition-colors",
              "text-white" // En mobile siempre blanco porque el fondo es oscuro
            )}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={cn(
            "md:hidden py-4 border-t animate-fade-up",
            theme === 'dark' ? "border-border" : "border-white/20"
          )}>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-secondary/20 text-secondary'
                      : theme === 'dark'
                        ? 'text-foreground/80 hover:bg-muted hover:text-foreground'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Mobile Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                  theme === 'light'
                    ? 'bg-white/10 hover:bg-white/20 text-white'
                    : 'bg-black/20 hover:bg-black/30 text-white'
                )}
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4" />
                    Modo Oscuro
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4" />
                    Modo Claro
                  </>
                )}
              </button>
              {isAuthenticated ? (
                <div className="mt-4 px-4 space-y-2">
                  {isOrganizer && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigate('/admin/dashboard');
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  )}
                  <div className={cn(
                    "px-4 py-2 rounded-lg flex items-center gap-2",
                    theme === 'dark' ? "bg-muted" : "bg-white/10"
                  )}>
                    <User className={cn("w-4 h-4", theme === 'dark' ? "text-foreground" : "text-white")} />
                    <span className={cn("text-sm", theme === 'dark' ? "text-foreground" : "text-white")}>{user?.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Salir
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 mt-4 px-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "flex-1 border-2 transition-colors",
                      theme === 'dark'
                        ? "bg-background text-foreground hover:bg-muted border-border"
                        : "bg-white text-foreground hover:bg-white/90 border-white/20"
                    )}
                    onClick={() => {
                      navigate('/login');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Ingresar
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      navigate('/register');
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Registrarse
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
