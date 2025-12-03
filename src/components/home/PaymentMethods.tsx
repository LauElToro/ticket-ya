import { CreditCard, Wallet, Banknote, Building2, ShieldCheck } from 'lucide-react';

const paymentMethods = [
  {
    icon: Wallet,
    name: 'MercadoPago',
    description: 'Pagá con tu cuenta de MercadoPago. Hasta 12 cuotas sin interés.',
    color: 'from-[#00AEEF]/20 to-[#00AEEF]/5',
    iconColor: 'text-[#00AEEF]',
  },
  {
    icon: CreditCard,
    name: 'Tarjeta de crédito',
    description: 'Visa, Mastercard, American Express. Hasta 6 cuotas.',
    color: 'from-secondary/20 to-secondary/5',
    iconColor: 'text-secondary',
  },
  {
    icon: CreditCard,
    name: 'Tarjeta de débito',
    description: 'Pagá directo desde tu cuenta bancaria de forma segura.',
    color: 'from-primary/20 to-primary/5',
    iconColor: 'text-primary',
  },
  {
    icon: Banknote,
    name: 'Efectivo',
    description: 'Pagá en efectivo en Rapipago, Pago Fácil y más.',
    color: 'from-accent/20 to-accent/5',
    iconColor: 'text-accent',
  },
  {
    icon: Building2,
    name: 'Transferencia bancaria',
    description: 'Transferí desde tu home banking o app del banco.',
    color: 'from-muted-foreground/20 to-muted-foreground/5',
    iconColor: 'text-muted-foreground',
  },
];

const PaymentMethods = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            <ShieldCheck className="w-4 h-4" />
            Pagos 100% seguros
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Medios de pago
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Elegí cómo querés pagar. Aceptamos todos los medios de pago para tu comodidad.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
          {paymentMethods.map((method, index) => {
            const Icon = method.icon;
            return (
              <div
                key={index}
                className="glass-card rounded-xl p-5 text-center hover-lift animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} items-center justify-center mb-4`}>
                  <Icon className={`w-7 h-7 ${method.iconColor}`} />
                </div>
                <h3 className="font-semibold mb-2">{method.name}</h3>
                <p className="text-muted-foreground text-sm">{method.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PaymentMethods;
