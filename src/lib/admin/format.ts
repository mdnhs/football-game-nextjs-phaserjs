export function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateOnly(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toISOString().split("T")[0];
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}
