import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getPlacementLabel(placement: number): string {
  switch (placement) {
    case 1: return "Quán quân";
    case 2: return "Á quân";
    case 3: return "Hạng 3";
    case 4: return "Hạng 4";
    default: return `Hạng ${placement}`;
  }
}

export function getPlacementColor(placement: number): string {
  switch (placement) {
    case 1: return "text-yellow-500";
    case 2: return "text-gray-400";
    case 3: return "text-amber-600";
    case 4: return "text-blue-400";
    default: return "text-gray-500";
  }
}
