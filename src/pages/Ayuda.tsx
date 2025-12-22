import { useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  HelpCircle,
  Mail,
  MessageCircle,
  Phone,
  Clock,
  Ticket,
  CreditCard,
  QrCode,
  User,
  Shield,
  FileText,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Ayuda = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqCategories = [
    {
      title: 'Compras y Pagos',
      icon: CreditCard,
      faqs: [
        {
          question: '¿Qué métodos de pago aceptan?',
          answer: 'Aceptamos MercadoPago (tarjetas de crédito, débito y dinero en cuenta), transferencia bancaria y pago en efectivo en puntos de pago cercanos como Rapipago y Pago Fácil.',
        },
        {
          question: '¿Cuánto tiempo tengo para pagar?',
          answer: 'Si elegís pago en efectivo o transferencia bancaria, tenés 7 días para completar el pago. Para pagos con MercadoPago, el pago se procesa inmediatamente.',
        },
        {
          question: '¿Puedo cancelar mi compra?',
          answer: 'Las cancelaciones dependen de las políticas del organizador del evento. Podés contactarnos para solicitar una cancelación y te ayudaremos a gestionarla.',
        },
        {
          question: '¿Recibo factura por mi compra?',
          answer: 'Sí, recibirás un comprobante por email y también podés descargarlo desde "Mis entradas" en cualquier momento.',
        },
      ],
    },
    {
      title: 'Entradas y Tickets',
      icon: Ticket,
      faqs: [
        {
          question: '¿Cómo recibo mis entradas?',
          answer: 'Recibirás tus entradas por email inmediatamente después de completar el pago. También podés acceder a ellas desde "Mis entradas" en tu perfil.',
        },
        {
          question: '¿Qué es el código QR?',
          answer: 'Cada entrada tiene un código QR único que se usa para validar tu entrada en el evento. No compartas tu código QR con nadie.',
        },
        {
          question: '¿Puedo transferir mis entradas?',
          answer: 'Sí, podés transferir tus entradas a otros usuarios registrados en Ticket-Ya mediante QR o email. La transferencia debe ser aceptada por el destinatario.',
        },
        {
          question: '¿Cuánto tiempo duran mis entradas?',
          answer: 'Tus entradas tienen una validez de 48 días hábiles desde la compra. Si no las usás en ese tiempo, se liberan automáticamente.',
        },
        {
          question: '¿Qué pasa si pierdo mi entrada?',
          answer: 'No te preocupes, podés acceder a tus entradas desde "Mis entradas" en cualquier momento y descargarlas nuevamente o reenviarlas por email.',
        },
      ],
    },
    {
      title: 'Cuenta y Perfil',
      icon: User,
      faqs: [
        {
          question: '¿Cómo me registro?',
          answer: 'Hacé clic en "Registrarse" en la parte superior de la página, completá tus datos y confirmá tu email. Es rápido y gratuito.',
        },
        {
          question: '¿Puedo cambiar mis datos personales?',
          answer: 'Sí, podés actualizar tu información personal desde tu perfil en cualquier momento.',
        },
        {
          question: '¿Qué hago si olvidé mi contraseña?',
          answer: 'En la página de inicio de sesión, hacé clic en "¿Olvidaste tu contraseña?" y seguí las instrucciones para restablecerla.',
        },
        {
          question: '¿Puedo tener múltiples cuentas?',
          answer: 'No es necesario. Podés comprar múltiples entradas desde una sola cuenta y transferirlas a otros usuarios si lo necesitás.',
        },
      ],
    },
    {
      title: 'Eventos',
      icon: HelpCircle,
      faqs: [
        {
          question: '¿Cómo encuentro eventos cerca de mí?',
          answer: 'Podés usar los filtros en la página de eventos para buscar por ciudad, categoría o fecha. También podés usar la barra de búsqueda.',
        },
        {
          question: '¿Puedo ver la ubicación del evento?',
          answer: 'Sí, en la página de detalle de cada evento encontrarás un mapa con la ubicación exacta y un enlace para obtener direcciones desde tu ubicación.',
        },
        {
          question: '¿Qué pasa si un evento se cancela?',
          answer: 'Si un evento se cancela, te contactaremos para procesar el reembolso completo de tus entradas.',
        },
        {
          question: '¿Puedo organizar mi propio evento?',
          answer: 'Sí, si querés organizar eventos, podés registrarte como organizador. Contactanos para más información sobre cómo empezar.',
        },
      ],
    },
    {
      title: 'Seguridad y Privacidad',
      icon: Shield,
      faqs: [
        {
          question: '¿Es seguro comprar en Ticket-Ya?',
          answer: 'Sí, utilizamos los más altos estándares de seguridad para proteger tus datos y pagos. Todas las transacciones están encriptadas.',
        },
        {
          question: '¿Comparten mi información con terceros?',
          answer: 'No, tu información personal está protegida y solo la compartimos con el organizador del evento para la gestión de las entradas.',
        },
        {
          question: '¿Cómo sé que mi entrada es auténtica?',
          answer: 'Cada entrada tiene un código QR único y firmado digitalmente que garantiza su autenticidad. Los organizadores pueden validarlo al escanearlo.',
        },
      ],
    },
  ];

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Centro de Ayuda
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Encontrá respuestas a tus preguntas o contactanos si necesitás ayuda adicional
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Buscar en preguntas frecuentes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-6 max-w-4xl mx-auto">
            {filteredFaqs.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <Card key={categoryIndex} className="glass-card border-2">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-2xl">{category.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {category.faqs.map((faq, faqIndex) => {
                      const globalIndex = categoryIndex * 100 + faqIndex;
                      const isOpen = openFaq === globalIndex;
                      return (
                        <div
                          key={faqIndex}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFaq(globalIndex)}
                            className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors text-left"
                          >
                            <span className="font-semibold text-base pr-4">{faq.question}</span>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-muted-foreground text-base leading-relaxed">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* No Results */}
          {searchQuery && filteredFaqs.length === 0 && (
            <Card className="glass-card border-2 max-w-2xl mx-auto mt-8">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No se encontraron resultados</h3>
                <p className="text-muted-foreground mb-4">
                  Intentá con otras palabras clave o contactanos directamente
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Limpiar búsqueda
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Contact Section */}
          <Card className="glass-card border-2 max-w-4xl mx-auto mt-12">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">¿No encontraste lo que buscabas?</CardTitle>
              <CardDescription className="text-lg">
                Estamos acá para ayudarte. Contactanos y te responderemos lo antes posible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Email</h3>
                  <p className="text-sm text-muted-foreground">soporte@ticket-ya.com</p>
                  <p className="text-xs text-muted-foreground mt-1">Respuesta en 24hs</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Chat en vivo</h3>
                  <p className="text-sm text-muted-foreground">Lun a Vie, 9:00 - 18:00</p>
                  <p className="text-xs text-muted-foreground mt-1">Disponible pronto</p>
                </div>
                <div className="text-center p-6 rounded-xl bg-muted/50">
                  <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Teléfono</h3>
                  <p className="text-sm text-muted-foreground">0800-123-4567</p>
                  <p className="text-xs text-muted-foreground mt-1">Lun a Vie, 9:00 - 18:00</p>
                </div>
              </div>

              {/* Contact Form */}
              <div className="border-t border-border pt-6">
                <h3 className="text-xl font-semibold mb-4">Enviános un mensaje</h3>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nombre</Label>
                      <Input id="name" placeholder="Tu nombre" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="tu@email.com" className="mt-2" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Asunto</Label>
                    <Input id="subject" placeholder="¿En qué podemos ayudarte?" className="mt-2" />
                  </div>
                  <div>
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                      id="message"
                      placeholder="Escribí tu mensaje aquí..."
                      className="mt-2 min-h-[120px]"
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full md:w-auto">
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar mensaje
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <Card className="glass-card border-2 hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Términos y Condiciones</h3>
                <p className="text-sm text-muted-foreground">Conocé nuestros términos de uso</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-2 hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Política de Privacidad</h3>
                <p className="text-sm text-muted-foreground">Cómo protegemos tus datos</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-2 hover:border-primary/50 transition-all cursor-pointer">
              <CardContent className="p-6 text-center">
                <HelpCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Cómo funciona</h3>
                <p className="text-sm text-muted-foreground">Aprendé más sobre Ticket-Ya</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Ayuda;

