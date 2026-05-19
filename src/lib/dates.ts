import { format, parseISO } from 'date-fns';

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? parseISO(value) : value;
  return format(d, 'MMM d, yyyy');
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? parseISO(value) : value;
  return format(d, 'MMM d, yyyy h:mm:ss a');
}

export function formatFilenameDateTime(date: Date = new Date()): string {
  // YYYYMMDD_HHMMSS in the user's local time, matching TBB filename convention
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}
