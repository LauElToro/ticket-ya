import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_EVENT_IMAGE = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80';

/** URL absoluta para mostrar imagen de evento (soporta Blob/Vercel y rutas relativas /uploads/...). */
export function getEventImageUrl(image: string | null | undefined, sizeHint = '800'): string {
  if (!image?.trim()) return DEFAULT_EVENT_IMAGE.replace('800', sizeHint);
  if (image.startsWith('http://') || image.startsWith('https://')) return image;
  const base = (import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '') || 'http://localhost:3000';
  return `${base}${image.startsWith('/') ? '' : '/'}${image}`;
}
