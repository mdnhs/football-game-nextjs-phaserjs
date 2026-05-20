import { useAuthStore } from "@/store/authStore";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  token?: string;
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  const token = opts.token ?? useAuthStore.getState().token;
  if (opts.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
  }

  if (!res.ok) {
    let errBody: { error?: string; details?: unknown } = {};
    try {
      errBody = await res.json();
    } catch {
      // ignore
    }
    throw new ApiError(
      errBody.error ?? `Request failed: ${res.status}`,
      res.status,
      errBody.details,
    );
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as { success: boolean; data: T };
  return json.data ?? (json as unknown as T);
}

export const apiBase = BASE;
