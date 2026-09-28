import { type ApiError } from '@/types/api.types';

type OnUnauthorizedCallback = () => void;
let unauthorizedListener: OnUnauthorizedCallback | null = null;

export function registerUnauthorizedListener(callback: OnUnauthorizedCallback) {
  unauthorizedListener = callback;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...customConfig } = options;

  const isJsonBody = body !== undefined && !(body instanceof FormData) && !(body instanceof Blob);

  const config: RequestInit = {
    method: options.method || (body ? 'POST' : 'GET'),
    credentials: 'include',
    headers: {
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...customConfig,
  };

  if (isJsonBody) {
    config.body = JSON.stringify(body);
  } else if (body !== undefined) {
    config.body = body as BodyInit;
  }

  const response = await fetch(endpoint, config);

  if (!response.ok) {
    let errorData: Partial<ApiError> = {};
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON response or empty body
    }

    const apiError: ApiError = {
      statusCode: response.status,
      message: errorData.message || response.statusText || 'Request failed',
      error: errorData.error,
    };

    if (response.status === 401 && unauthorizedListener) {
      unauthorizedListener();
    }

    throw apiError;
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as Promise<T>;
}
