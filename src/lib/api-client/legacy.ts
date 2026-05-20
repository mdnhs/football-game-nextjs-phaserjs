import { useAuthStore } from '@/features/auth/store/auth-store';

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
  auth?: boolean;
  token?: string;
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
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers as Record<string, string> | undefined),
  };

  const token = opts.token ?? useAuthStore.getState().token;
  if (opts.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path), {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401) {
    useAuthStore.getState().clearAuth();
  }

  if (!res.ok) {
    let errBody: { message?: string; error?: string | boolean; details?: unknown } = {};
    try {
      errBody = await res.json();
    } catch {
      // ignore
    }
    const msg =
      errBody.message ?? (typeof errBody.error === 'string' ? errBody.error : `Request failed: ${res.status}`);
    throw new ApiError(msg, res.status, errBody.details);
  }

  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as BackendEnvelope<unknown>;

  // Standard envelope → unwrap .data (pagination ignored — game features don't paginate)
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}

// Root URL — for non-versioned endpoints like /qr/{ref} and /health
export const apiBase = BASE_URL;
export const apiVersionedBase = FULL_BASE;
