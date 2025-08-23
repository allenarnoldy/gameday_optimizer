export type Window = "Noon" | "3PM" | "Other";
export function labelWindowLocal(iso?: string): Window {
if (!iso) return "Other";
const d = new Date(iso);
const hour = d.getHours();
if (hour >= 12 && hour < 15) return "Noon";
if (hour >= 15 && hour < 19) return "3PM";
return "Other";
}
export const currency = (n: number) =>
n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));