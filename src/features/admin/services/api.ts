import { getSession } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? '/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION ?? '/v1';
const FULL_BASE = `${BASE_URL}${API_PREFIX}${API_VERSION}`;

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  raw?: boolean;
}

interface BackendPagination {
  totalData: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface BackendEnvelope<T> {
  error: boolean;
  message: string;
  data: T;
  pagination?: BackendPagination;
  status?: number;
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) return path;
  if (path.startsWith(`${API_PREFIX}${API_VERSION}`)) return `${BASE_URL}${path}`;
  if (path.startsWith(API_PREFIX)) return `${FULL_BASE}${path.slice(API_PREFIX.length)}`;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${FULL_BASE}${clean}`;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const session = await getSession();
  const token = session?.user?.accessToken;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path), {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    let errBody: { message?: string; error?: string | boolean; details?: unknown } = {};
    try {
      errBody = await res.json();
    } catch {
      // non-JSON
    }
    const msg =
      errBody.message ?? (typeof errBody.error === 'string' ? errBody.error : `Request failed: ${res.status}`);
    throw new ApiError(msg, res.status, errBody.details);
  }

  if (opts.raw) return res as unknown as T;
  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as BackendEnvelope<unknown>;

  // Paginated response → adapt to frontend Paginated<T> shape
  if (json && typeof json === 'object' && 'pagination' in json && json.pagination) {
    const p = json.pagination;
    return {
      data: json.data,
      total: p.totalData,
      page: p.currentPage,
      limit: p.limit,
    } as T;
  }

  // Standard envelope → unwrap .data
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

export async function apiBlob(path: string): Promise<Blob> {
  const session = await getSession();
  const token = session?.user?.accessToken;
  const res = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError(`Request failed: ${res.status}`, res.status);
  return res.blob();
}

// Root URL — for non-versioned endpoints like /qr/{ref}
export const apiBase = BASE_URL;
export const apiVersionedBase = FULL_BASE;
