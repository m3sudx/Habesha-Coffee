import { API_ORIGIN } from "@/lib/api/client";

// All prices come from the API in cents.
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatSize(grams: number): string {
  return grams >= 1000 ? `${grams / 1000} kg` : `${grams} g`;
}

// "whole_bean" -> "Whole bean"
export function formatGrind(grind: string): string {
  const text = grind.replace(/[_-]/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The API stores image paths like /uploads/abc.jpg; the browser needs the full address.
export function imageSrc(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}
