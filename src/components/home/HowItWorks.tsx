import { Search, CreditCard, QrCode, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'Elegí tu evento',
    description: 'Explorá nuestro catálogo de eventos y encontrá el que más te guste.',
  },
  {
    icon: CreditCard,
    title: 'Pagá de forma segura',
    description: 'Elegí tu medio de pago favorito: tarjeta, MercadoPago, efectivo o transferencia.',
  },
  {
    icon: QrCode,
    title: 'Recibí tu ticket',
    description: 'Te enviamos tu entrada digital con código QR a tu email al instante.',
  },
  {
    icon: CheckCircle,
    title: 'Disfrutá el evento',
    description: 'Presentá tu QR en la entrada y listo. ¡A disfrutar!',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprar tus entradas nunca fue tan fácil. En solo 4 pasos ya tenés tu ticket.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative text-center animate-fade-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-secondary to-secondary/20" />
                )}

                {/* Step Number */}
                <div className="relative inline-flex mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center">
                    <Icon className="w-10 h-10 text-secondary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
