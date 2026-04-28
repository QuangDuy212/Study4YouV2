import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "/api/v1";
  
  // Ensure path starts with /uploads
  let path = url;
  if (!path.startsWith('/uploads') && !path.startsWith('uploads')) {
    path = path.startsWith('/') ? `/uploads${path}` : `/uploads/${path}`;
  } else if (!path.startsWith('/')) {
    path = `/${path}`;
  }
  
  return encodeURI(`${baseUrl}${path}`);
}
