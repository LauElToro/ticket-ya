import { Link } from 'react-router-dom';
import { Instagram, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-pulso-black via-pulso-purple/20 to-pulso-black text-white border-t border-pulso-purple/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-pulso-purple via-pulso-magenta to-pulso-coral flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-lg shadow-pulso-purple/30">
                <span className="text-white font-display font-bold text-xs tracking-tight relative z-10 pulso-brand-text">PULSO</span>
              </div>
              <span className="font-display font-bold text-xl bg-gradient-to-r from-pulso-purple via-pulso-magenta to-pulso-coral bg-clip-text text-transparent pulso-brand-text">
                PULSO
              </span>
            </Link>
            <div className="space-y-2 pulso-tagline">
              <p className="text-white/90 text-sm">
                RITMO DEL CORAZÓN
              </p>
              <p className="text-white/90 text-sm">
                ALMA DE LA MÚSICA
              </p>
            </div>
            <p className="text-white/70 text-sm">
              Una vibrante productora desarrolladora de eventos. 
              Creando experiencias únicas y memorables.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://www.instagram.com/pulso.experiences" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/70 hover:text-pulso-coral transition-colors duration-300 hover:scale-110"
                aria-label="Instagram de Pulso Experiences"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Enlaces rápidos</h4>
            <ul className="space-y-2">
              {['Eventos', 'Cómo funciona', 'Ayuda', 'Mis entradas'].map((item) => (
                <li key={item}>
                  <Link 
                    to={`/${item.toLowerCase().replace(/ /g, '-')}`}
                    className="text-white/70 hover:text-pulso-coral transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2">
              {['Términos y condiciones', 'Política de privacidad', 'Política de reembolso', 'Preguntas frecuentes'].map((item) => (
                <li key={item}>
                  <Link 
                    to="#"
                    className="text-white/70 hover:text-pulso-coral transition-colors text-sm"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contacto</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Mail className="w-4 h-4" />
                soporte@pulsoexperiences.com
              </li>
              <li className="flex items-center gap-2 text-sm text-white/70">
                <Phone className="w-4 h-4" />
                0800-222-TICKET
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-pulso-purple/30 mt-8 pt-8 text-center text-sm text-white/60">
          <p>© 2024 Pulso Experiences. Todos los derechos reservados <Link to="https://www.linkedin.com/in/lautaro-figueroa-b0702b26a/" target="_blank" className="text-pulso-coral hover:text-pulso-magenta transition-colors"> Lautaro Figueroa.</Link></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
