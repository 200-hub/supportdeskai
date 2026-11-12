// Centralized API Client for SupportDeskAI
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Resolution order:
// 1. EXPO_PUBLIC_API_URL (frontend/.env) — cloud backend, or tunnel mode.
// 2. The LAN IP of the PC running `expo start` (Expo Go on a phone, emulators).
//    The backend must listen on 0.0.0.0:8000 on that same PC.
// 3. The browser's own host for `expo start --web`.
const getDefaultBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`;
  }
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];
  if (host && !host.endsWith('.exp.direct')) {
    return `http://${host}:8000`;
  }
  // ponytail: tunnel mode can't reach a LAN backend; set EXPO_PUBLIC_API_URL instead
  return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
};

export const API_BASE_URL = getDefaultBaseUrl();

let cachedAuthToken = null;
let onUnauthorizedHandler = null;

export const setApiAuthToken = (token) => {
  cachedAuthToken = token;
};

export const getApiAuthToken = () => cachedAuthToken;

export const setOnUnauthorizedHandler = (handler) => {
  onUnauthorizedHandler = handler;
};

/**
 * Robust HTTP fetch wrapper with timeout and standard response parsing.
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = options.token || cachedAuthToken;

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutMs = options.timeout || 8000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (
        response.status === 401 &&
        onUnauthorizedHandler &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !endpoint.includes('/auth/refresh')
      ) {
        try {
          onUnauthorizedHandler();
        } catch (_) {}
      }

      const errorMessage =
        (typeof data === 'object' && (data.message || data.detail)) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return { success: true, data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);
    const isNetworkError =
      error.name === 'AbortError' ||
      error.message.includes('Network request failed') ||
      error.message.includes('Failed to fetch');

    return {
      success: false,
      error: error.message || 'Unknown network error',
      isNetworkError,
      status: error.status || (isNetworkError ? 0 : 500),
      data: error.data || null,
    };
  }
}

export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};

