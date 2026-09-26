import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const QATAR_TIME_ZONE = "Asia/Qatar";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQar(value: string | number) {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "Not set";
  const date = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00+03:00`)
    : new Date(value);
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: QATAR_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: QATAR_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}

export function qatarLocalToDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(`${value}:00+03:00`);
}

export function toQatarDateTimeInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: QATAR_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function calculateProgress(statuses: string[]) {
  if (statuses.length === 0) return 0;
  return Math.round((statuses.filter((status) => status === "DONE").length / statuses.length) * 100);
}

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function humanFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
