import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | undefined | null) {
  if (!path) return "/avatar_default.png";
  if (path.startsWith("http")) return path;
  
  // Remove /api suffix if present in base URL to point to root for static uploads
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');
  
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
}