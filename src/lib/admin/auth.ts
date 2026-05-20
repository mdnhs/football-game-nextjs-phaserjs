const KEY = "admin_secret";

export function getAdminSecret(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY);
}

export function setAdminSecret(secret: string): void {
  window.localStorage.setItem(KEY, secret);
}

export function clearAdminSecret(): void {
  window.localStorage.removeItem(KEY);
}
