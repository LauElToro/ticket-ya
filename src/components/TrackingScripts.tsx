import { useEffect } from 'react';

interface TrackingScriptsProps {
  metaPixelId?: string | null;
  googleAdsId?: string | null;
  eventName?: string;
  eventValue?: number;
  eventCurrency?: string;
}

export const TrackingScripts = ({
  metaPixelId,
  googleAdsId,
  eventName,
  eventValue,
  eventCurrency = 'ARS',
}: TrackingScriptsProps) => {
  useEffect(() => {
    // Meta Pixel Script
    if (metaPixelId) {
      // Verificar si ya existe el script
      if (!document.getElementById('meta-pixel-script')) {
        // Cargar Meta Pixel base script
        const script = document.createElement('script');
        script.id = 'meta-pixel-script';
        script.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${metaPixelId}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(script);

        // Agregar noscript fallback
        const noscript = document.createElement('noscript');
        noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1"/>`;
        document.body.appendChild(noscript);
      } else {
        // Si el script ya existe, solo inicializar con el nuevo ID si es diferente
        if ((window as any).fbq) {
          (window as any).fbq('init', metaPixelId);
          (window as any).fbq('track', 'PageView');
        }
      }

      // Trackar evento personalizado si se proporciona
      if (eventName && (window as any).fbq) {
        (window as any).fbq('track', eventName, {
          value: eventValue,
          currency: eventCurrency,
        });
      }
    }

    // Google Ads Script
    if (googleAdsId) {
      // Verificar si ya existe el script
      if (!document.getElementById('google-ads-script')) {
        const script = document.createElement('script');
        script.id = 'google-ads-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAdsId}`;
        document.head.appendChild(script);

        // Inicializar gtag
        const initScript = document.createElement('script');
        initScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAdsId}');
        `;
        document.head.appendChild(initScript);
      }

      // Trackar conversión si se proporciona
      if (eventName === 'Purchase' && eventValue && (window as any).gtag) {
        (window as any).gtag('event', 'conversion', {
          'send_to': googleAdsId,
          'value': eventValue,
          'currency': eventCurrency,
        });
      }
    }
  }, [metaPixelId, googleAdsId, eventName, eventValue, eventCurrency]);

  return null;
};

// Hook para trackear eventos personalizados
export const useTrackEvent = () => {
  const trackPurchase = (metaPixelId: string | null | undefined, googleAdsId: string | null | undefined, value: number, currency: string = 'ARS') => {
    // Meta Pixel Purchase Event
    if (metaPixelId && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: value,
        currency: currency,
      });
    }

    // Google Ads Conversion
    if (googleAdsId && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': googleAdsId,
        'value': value,
        'currency': currency,
      });
    }
  };

  const trackViewContent = (metaPixelId: string | null | undefined, contentName: string, contentCategory?: string) => {
    if (metaPixelId && (window as any).fbq) {
      (window as any).fbq('track', 'ViewContent', {
        content_name: contentName,
        content_category: contentCategory,
      });
    }
  };

  const trackAddToCart = (metaPixelId: string | null | undefined, value: number, currency: string = 'ARS') => {
    if (metaPixelId && (window as any).fbq) {
      (window as any).fbq('track', 'AddToCart', {
        value: value,
        currency: currency,
      });
    }
  };

  const trackInitiateCheckout = (metaPixelId: string | null | undefined, value: number, currency: string = 'ARS') => {
    if (metaPixelId && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        value: value,
        currency: currency,
      });
    }
  };

  return {
    trackPurchase,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
  };
};

