import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return count.toString();
}

/**
 * Optimizes Supabase image URLs using its built-in transformation service.
 * Appends parameters for resizing and compression.
 */
export function optimizeImage(url: string | null | undefined, width = 1200, quality = 60): string {
  if (!url) return '';
  if (!url.includes('supabase.co')) return url;
  
  // Supabase transformation service
  if (url.includes('/storage/v1/object/public/')) {
    const transformedUrl = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
    const separator = transformedUrl.includes('?') ? '&' : '?';
    // Using 60 quality for a good balance of crispness and size
    return `${transformedUrl}${separator}width=${width}&quality=${quality}&format=webp&resize=contain`;
  }
  
  return url;
}
