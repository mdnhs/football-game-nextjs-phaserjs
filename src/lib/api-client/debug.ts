/**
 * Comprehensive debugging system for SSR API requests.
 * Enabled when NODE_ENV=development or NEXT_PUBLIC_DEBUG_API=true.
 */

interface DebugRequestInfo {
  timestamp: string;
  environment: 'server' | 'client';
  url: string;
  fullUrl: string;
  method: string;
  headers: Record<string, string>;
  body?: string | object;
  queryParams?: Record<string, string | string[]>;
}

interface DebugResponseInfo {
  timestamp: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: unknown;
  duration: number;
}

const formatHeaders = (headers: Headers): Record<string, string> => {
  const headerObj: Record<string, string> = {};
  headers.forEach((value, key) => {
    headerObj[key] = value;
  });
  return headerObj;
};

const extractQueryParams = (url: string): Record<string, string | string[]> | undefined => {
  try {
    const urlObj = new URL(url);
    const params: Record<string, string | string[]> = {};
    urlObj.searchParams.forEach((value, key) => {
      if (params[key]) {
        if (Array.isArray(params[key])) {
          (params[key] as string[]).push(value);
        } else {
          params[key] = [params[key] as string, value];
        }
      } else {
        params[key] = value;
      }
    });
    return Object.keys(params).length > 0 ? params : undefined;
  } catch {
    return undefined;
  }
};

const parseRequestBody = (body?: BodyInit | null): string | object | undefined => {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return '[Binary/FormData/Complex Body]';
};

export const logRequest = (url: string, fullUrl: string, options: RequestInit): DebugRequestInfo => {
  const debugInfo: DebugRequestInfo = {
    timestamp: new Date().toISOString(),
    environment: typeof window === 'undefined' ? 'server' : 'client',
    url,
    fullUrl,
    method: options.method || 'GET',
    headers: options.headers ? formatHeaders(options.headers as Headers) : {},
    body: parseRequestBody(options.body),
    queryParams: extractQueryParams(fullUrl),
  };

  console.log('[API REQUEST]', debugInfo);
  return debugInfo;
};

export const logResponse = async (response: Response, startTime: number): Promise<DebugResponseInfo> => {
  const duration = Date.now() - startTime;
  const clonedResponse = response.clone();
  let responseBody: unknown;
  try {
    const text = await clonedResponse.text();
    responseBody = text ? JSON.parse(text) : null;
  } catch {
    responseBody = '[Could not parse response body]';
  }

  const debugInfo: DebugResponseInfo = {
    timestamp: new Date().toISOString(),
    status: response.status,
    statusText: response.statusText,
    headers: formatHeaders(response.headers),
    body: responseBody,
    duration,
  };

  console.log('[API RESPONSE]', debugInfo);
  return debugInfo;
};

export const logError = (error: unknown, url: string, startTime: number): void => {
  const duration = Date.now() - startTime;
  console.log('[API ERROR]', {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : String(error),
    url,
    duration,
    stack: error instanceof Error ? error.stack : undefined,
  });
};

export const isDebugEnabled = (): boolean =>
  process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_API === 'true';
