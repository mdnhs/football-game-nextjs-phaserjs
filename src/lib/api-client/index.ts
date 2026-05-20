/**
 * Unified API Client for handling all HTTP requests.
 * Automatically detects server/client environment.
 * Provides standardized error handling, authentication, and request formatting.
 */
import { isDebugEnabled, logError, logRequest, logResponse } from '@/lib/api-client/debug';

export interface PaginationApiResponse {
  total: number;
  total_pages: number;
  current_page: number;
  limit: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface BackendApiResponse<T> {
  data: T | null;
  pagination?: PaginationApiResponse;
  error: boolean;
  message: string;
}

export type NetworkError = {
  message?: string;
  code?: string;
  details?: unknown;
};

export interface ValidationError {
  type: string;
}

export interface ValidationCauses {
  [fieldName: string]: ValidationError[];
}

export type ApiResponse<T> = {
  data: {
    data: T | null;
    pagination?: PaginationApiResponse;
    error: boolean;
    message: string;
    causes?: ValidationCauses;
  } | null;
  error: NetworkError | null;
  status: number;
};

export interface ApiClientConfig {
  baseUrl?: string;
  apiPrefix?: string;
  apiVersion?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
}

const DEFAULT_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
  API_PREFIX: process.env.NEXT_PUBLIC_API_PREFIX || '/api',
  API_VERSION: process.env.NEXT_PUBLIC_API_VERSION || '/v1',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT || 30000),
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

const API_CONFIG = { ...DEFAULT_CONFIG };

const isServerSide = (): boolean => typeof window === 'undefined';

const getClientIP = async (): Promise<string | null> => {
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_CLIENT_IP) {
    return process.env.MOCK_CLIENT_IP;
  }
  if (!isServerSide()) return null;
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const middlewareIP = headersList.get('x-client-ip');
    if (middlewareIP) return middlewareIP;
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIP = headersList.get('x-real-ip');
    const cfConnectingIP = headersList.get('cf-connecting-ip');
    const vercelIP = headersList.get('x-vercel-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    return cfConnectingIP || vercelIP || realIP || null;
  } catch (error) {
    console.error('Failed to get client IP:', error);
    return null;
  }
};

const getAuthToken = async (): Promise<string | null> => {
  // TODO: integrate w/ Firebase auth or admin auth token
  return null;
};

const getCurrentSession = async () => {
  return null;
};

export const isAuthenticated = async (): Promise<boolean> => {
  return true;
};

export const configureApiClient = (config: ApiClientConfig): void => {
  if (config.baseUrl) API_CONFIG.BASE_URL = config.baseUrl;
  if (config.apiPrefix) API_CONFIG.API_PREFIX = config.apiPrefix;
  if (config.apiVersion) API_CONFIG.API_VERSION = config.apiVersion;
  if (config.timeout) API_CONFIG.TIMEOUT = config.timeout;
  if (config.defaultHeaders) {
    API_CONFIG.DEFAULT_HEADERS = { ...API_CONFIG.DEFAULT_HEADERS, ...config.defaultHeaders };
  }
};

export const getApiBaseUrl = (): string => `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.API_VERSION}`;

export const getApiConfig = () => ({
  baseUrl: API_CONFIG.BASE_URL,
  apiPrefix: API_CONFIG.API_PREFIX,
  apiVersion: API_CONFIG.API_VERSION,
  timeout: API_CONFIG.TIMEOUT,
  fullApiUrl: getApiBaseUrl(),
  environment: isServerSide() ? 'server' : 'client',
});

const createTimeoutPromise = (ms: number): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms));

const createHeaders = async (customHeaders?: HeadersInit): Promise<Headers> => {
  const headers = new Headers(API_CONFIG.DEFAULT_HEADERS);
  const token = await getAuthToken();
  if (token) headers.append('Authorization', `Bearer ${token}`);
  if (isServerSide()) {
    const clientIP = await getClientIP();
    if (clientIP) {
      headers.append('X-Client-IP', clientIP);
      headers.append('X-Forwarded-For', clientIP);
    }
  }
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      if (value !== undefined && value !== null) headers.set(key, String(value));
    });
  }
  return headers;
};

const formatNetworkErrorResponse = <T>(error: unknown, status = 500): ApiResponse<T> => {
  let message = 'Network error occurred';
  let details: unknown = undefined;
  if (error instanceof Error) {
    message = error.message;
    details = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    message = String(error);
    details = error;
  }
  return { data: null, error: { message, details }, status };
};

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const status = response.status;

  if (status === 503) {
    if (!isServerSide()) {
      window.location.href = '/maintenance';
    } else {
      const { redirect } = await import('next/navigation');
      redirect('/maintenance');
    }
  }

  if (response.ok) {
    try {
      const text = await response.text();
      const data = text ? (JSON.parse(text) as BackendApiResponse<T>) : null;
      return { data, error: null, status };
    } catch {
      return formatNetworkErrorResponse(new Error('Failed to parse successful response'), status);
    }
  }

  try {
    const text = await response.text();
    const data = text ? (JSON.parse(text) as BackendApiResponse<T>) : null;
    return { data, error: null, status };
  } catch {
    return formatNetworkErrorResponse(
      new Error(`Request failed with status ${status} - Invalid response format`),
      status,
    );
  }
};

const buildFullUrl = (url: string): string => {
  if (url.startsWith('http')) return url;
  if (url.startsWith(`${API_CONFIG.API_PREFIX}${API_CONFIG.API_VERSION}`)) return `${API_CONFIG.BASE_URL}${url}`;
  if (url.startsWith(API_CONFIG.API_PREFIX))
    return `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.API_VERSION}${url.replace(
      API_CONFIG.API_PREFIX,
      '',
    )}`;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${getApiBaseUrl()}${cleanUrl}`;
};

export const apiRequest = async <T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const startTime = Date.now();
  try {
    const fullUrl = buildFullUrl(url);
    const requestOptions: RequestInit = {
      ...options,
      headers: await createHeaders(options.headers),
    };
    if (isDebugEnabled()) logRequest(url, fullUrl, requestOptions);
    const response = (await Promise.race([
      fetch(fullUrl, requestOptions),
      createTimeoutPromise(API_CONFIG.TIMEOUT),
    ])) as Response;
    if (isDebugEnabled()) await logResponse(response, startTime);
    return await parseResponse<T>(response);
  } catch (error) {
    if (isDebugEnabled()) logError(error, url, startTime);
    if (error && typeof error === 'object' && 'digest' in error) {
      const digest = (error as { digest?: string }).digest;
      if (typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT')) throw error;
    }
    return formatNetworkErrorResponse<T>(error);
  }
};

export const get = async <T>(
  url: string,
  params?: Record<string, string | string[]>,
  headers?: HeadersInit,
): Promise<ApiResponse<T>> => {
  let requestUrl = url;
  if (params) {
    const queryString = Object.entries(params)
      .map(([key, value]) =>
        Array.isArray(value)
          ? value.map((item) => `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`).join('&')
          : `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      )
      .join('&');
    if (queryString) requestUrl += `${url.includes('?') ? '&' : '?'}${queryString}`;
  }
  return apiRequest<T>(requestUrl, { method: 'GET', headers });
};

export const post = async <T>(url: string, data?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> =>
  apiRequest<T>(url, { method: 'POST', headers, body: data ? JSON.stringify(data) : undefined });

export const put = async <T>(url: string, data?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> =>
  apiRequest<T>(url, { method: 'PUT', headers, body: data ? JSON.stringify(data) : undefined });

export const patch = async <T>(url: string, data?: unknown, headers?: HeadersInit): Promise<ApiResponse<T>> =>
  apiRequest<T>(url, { method: 'PATCH', headers, body: data ? JSON.stringify(data) : undefined });

export const del = async <T>(url: string, headers?: HeadersInit): Promise<ApiResponse<T>> =>
  apiRequest<T>(url, { method: 'DELETE', headers });

export const isBackendSuccess = <T>(response: ApiResponse<T>): boolean =>
  response.error === null && response.data !== null && !response.data.error && response.status < 400;

export const extractBackendData = <T>(response: ApiResponse<T>): T | null =>
  isBackendSuccess(response) ? response.data!.data : null;

export const extractValidationCauses = <T>(response: ApiResponse<T>): ValidationCauses | null =>
  !isBackendSuccess(response) ? (response.data?.causes ?? null) : null;

export const extractPagination = <T>(response: ApiResponse<T>): PaginationApiResponse | null =>
  response.data?.pagination ?? null;

export const getBackendErrorMessage = <T>(response: ApiResponse<T>): string | null =>
  response.data?.error ? response.data.message : null;

export const getMessage = <T>(response: ApiResponse<T>): string => {
  if (response.error) return response.error.message || 'Network error occurred';
  if (response.data?.error) return response.data.message;
  if (response.status >= 400) return response.data?.message || `Request failed with status ${response.status}`;
  if (response.data && !response.data.error) return response.data.message;
  return 'Unknown error occurred';
};

export const hasError = <T>(response: ApiResponse<T>): boolean => !isBackendSuccess(response);

export const getStatusCode = <T>(response: ApiResponse<T>): number => response.status;

export const restApiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  request: apiRequest,
  configure: configureApiClient,
  getConfig: getApiConfig,
  getBaseUrl: getApiBaseUrl,
  isAuthenticated,
  getCurrentSession,
  isBackendSuccess,
  extractBackendData,
  extractPagination,
  getBackendErrorMessage,
  getMessage,
  hasError,
  getStatusCode,
};

export default restApiClient;
