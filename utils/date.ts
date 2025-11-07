// utils/date.ts
export function parseSystemDateToLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Construct a local Date with year, month (0-based), and day
  return new Date(year, month - 1, day, 0, 0, 0);
}
