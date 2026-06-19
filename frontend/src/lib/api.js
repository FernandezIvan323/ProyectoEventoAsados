import { clearStoredToken, getStoredToken } from '@/lib/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export async function apiRequest(path, options = {}) {
  const token = getStoredToken();
  const { headers: customHeaders, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearStoredToken();
      if (!path.includes('/auth/')) {
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
    }

    if (!response.ok) {
      let message = `Error ${response.status}`;
      try {
        const body = await response.json();
        message = body.error || message;
      } catch {
        // Keep the HTTP status message when the response is empty.
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
