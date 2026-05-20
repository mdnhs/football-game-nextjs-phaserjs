import { getAdminSecret } from "./auth";

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
  raw?: boolean;
}

export async function api<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const secret = getAdminSecret();
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (secret) headers["x-admin-secret"] = secret;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let errBody: { error?: string; details?: unknown } = {};
    try {
      errBody = await res.json();
    } catch {
      // non-JSON
    }
    throw new ApiError(
      errBody.error ?? `Request failed: ${res.status}`,
      res.status,
      errBody.details,
    );
  }

  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as { success: boolean; data: T };
  return json.data ?? (json as unknown as T);
}

export async function apiBlob(path: string): Promise<Blob> {
  const secret = getAdminSecret();
  const res = await fetch(`${BASE}${path}`, {
    headers: secret ? { "x-admin-secret": secret } : {},
  });
  if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);
  return res.blob();
}

export const apiBase = BASE;
