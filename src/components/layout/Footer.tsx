import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-bold text-xs tracking-tight">PULSO</span>
              </div>
            </Link>
            <p className="text-primary-foreground/70 text-sm">
              La plataforma líder de venta de entradas en Argentina. 
              Comprá tus tickets de forma segura y recibilos al instante.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://www.instagram.com/pulso.experiences" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-foreground/70 hover:text-secondary transition-colors"
                aria-label="Instagram de Pulso Experiences"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Enlaces rápidos</h4>
            <ul className="space-y-2">
              {['Eventos', 'Cómo funciona', 'Ayuda', 'Mis entradas'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="text-primary-foreground/70 hover:text-secondary transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {['Términos y condiciones', 'Política de privacidad', 'Política de reembolso', 'Preguntas frecuentes'].map((item) => (
                <li key={item}>
                  <Link 
                    to="#"
                    className="text-primary-foreground/70 hover:text-secondary transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Mail className="w-4 h-4" />
                soporte@pulsoexperiences.com
              </li>
              <li className="flex items-center gap-2 text-sm text-primary-foreground/70">
                <Phone className="w-4 h-4" />
                0800-222-TICKET
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© 2024 Pulso Experiences. Todos los derechos reservados <Link to="https://www.linkedin.com/in/lautaro-figueroa-b0702b26a/" target="_blank" className="text-secondary hover:text-secondary-foreground transition-colors"> Lautaro Figueroa.</Link></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
