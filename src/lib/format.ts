export function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

export function shortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

export function fullDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date);
}

export const TODAY = "2026-09-09";

export function daysUntil(value: string) {
  const target = new Date(`${value}T12:00:00`).getTime();
  const today = new Date(`${TODAY}T12:00:00`).getTime();
  return Math.round((target - today) / 86400000);
}

export function deadlineLabel(value: string) {
  const days = daysUntil(value);
  if (days < 0) return `${Math.abs(days)} dia(s) em atraso`;
  if (days === 0) return "Entrega hoje";
  if (days === 1) return "Amanhã";
  return `em ${days} dias`;
}
