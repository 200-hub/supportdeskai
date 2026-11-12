// Authentication Service for SupportDeskAI
import { api, setApiAuthToken, setOnUnauthorizedHandler } from './apiClient';
import { offlineStorage } from './offlineStorage';

// The API sends snake_case; screens read camelCase (avatarInitials). Keep both.
export const toUiUser = (u) =>
  u ? { ...u, avatarInitials: u.avatarInitials || u.avatar_initials || 'SD' } : u;

let refreshInFlight = null;

export const authService = {
  /**
   * Log in user with real FastAPI backend
   */
  async login(email, password, role = null, tenantSlug = 'default-tenant') {
    const payload = {
      email,
      password,
      role: role || undefined,
      tenant_slug: tenantSlug,
    };

    const res = await api.post('/api/v1/auth/login', payload);
    if (res.success && res.data) {
      const { access_token, refresh_token } = res.data;
      const user = toUiUser(res.data.user);
      setApiAuthToken(access_token);
      await offlineStorage.saveAuth(access_token, user, refresh_token);
      return { success: true, user, token: access_token, refreshToken: refresh_token };
    }

    // Check if device is offline and user was previously authenticated
    if (res.isNetworkError) {
      const { user, token } = await offlineStorage.getStoredAuth();
      if (user && user.email.toLowerCase() === email.toLowerCase()) {
        setApiAuthToken(token);
        return {
          success: true,
          user,
          token,
          isOfflineSession: true,
          message: 'Operating in offline mode. Cached session restored.',
        };
      }
    }

    return {
      success: false,
      error: res.error || 'Login failed. Please verify your credentials.',
      isNetworkError: res.isNetworkError,
    };
  },

  /**
   * Register new user account
   */
  async register(userData) {
    const payload = {
      email: userData.email,
      name: userData.name,
      password: userData.password,
      role: userData.role || 'customer',
      phone: userData.phone || null,
      company: userData.company || null,
      tenant_slug: userData.tenantSlug || 'default-tenant',
    };

    const res = await api.post('/api/v1/auth/register', payload);
    if (res.success && res.data) {
      const { access_token, refresh_token } = res.data;
      const user = toUiUser(res.data.user);
      setApiAuthToken(access_token);
      await offlineStorage.saveAuth(access_token, user, refresh_token);
      return { success: true, user, token: access_token, refreshToken: refresh_token };
    }

    return {
      success: false,
      error: res.error || 'Registration failed. Please check your information.',
      isNetworkError: res.isNetworkError,
    };
  },

  /**
   * Rotate refresh token and retrieve a fresh access token
   */
  refreshToken() {
    // A 401 triggers the global handler AND restoreSession's own refresh. Two
    // concurrent calls with the same token look like token reuse to the server,
    // which revokes every session and logs the user out. Share one request.
    if (!refreshInFlight) {
      refreshInFlight = this._refreshToken().finally(() => {
        refreshInFlight = null;
      });
    }
    return refreshInFlight;
  },

  async _refreshToken() {
    const { refreshToken } = await offlineStorage.getStoredAuth();
    if (!refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    const res = await api.post('/api/v1/auth/refresh', { refresh_token: refreshToken });
    if (res.success && res.data) {
      const { access_token, refresh_token: newRefreshToken } = res.data;
      const user = toUiUser(res.data.user);
      setApiAuthToken(access_token);
      await offlineStorage.saveAuth(access_token, user, newRefreshToken);
      return { success: true, user, token: access_token, refreshToken: newRefreshToken };
    }

    // Refresh failed (revoked, expired, or reuse detected) -> clear auth state
    setApiAuthToken(null);
    await offlineStorage.clearAuth();
    return {
      success: false,
      error: res.error || 'Session expired. Please log in again.',
    };
  },

  /**
   * Log out session
   */
  async logout() {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (_) {
      // Best-effort logout
    }
    setApiAuthToken(null);
    await offlineStorage.clearAuth();
    return { success: true };
  },

  /**
   * Restore persisted session on app launch
   */
  async restoreSession() {
    const { token, user, refreshToken } = await offlineStorage.getStoredAuth();
    if (!token || !user) {
      return { isAuthenticated: false, user: null, token: null };
    }

    setApiAuthToken(token);

    // Verify token validity with backend if network is available
    const meRes = await api.get('/api/v1/auth/me', { token });
    if (meRes.success && meRes.data) {
      const freshUser = toUiUser(meRes.data);
      await offlineStorage.saveAuth(token, freshUser, refreshToken);
      return { isAuthenticated: true, user: freshUser, token };
    }

    // If access token is expired or unauthorized (401), attempt refresh with refresh token
    if (meRes.status === 401 && refreshToken) {
      const refreshRes = await this.refreshToken();
      if (refreshRes.success) {
        return { isAuthenticated: true, user: refreshRes.user, token: refreshRes.token };
      }
    }

    // If network error, still restore session offline
    if (meRes.isNetworkError) {
      return { isAuthenticated: true, user, token, isOffline: true };
    }

    // Token expired or invalid on server and refresh failed
    await offlineStorage.clearAuth();
    setApiAuthToken(null);
    return { isAuthenticated: false, user: null, token: null };
  },
};

// Wire up automatic token refresh attempt on unauthorized responses
setOnUnauthorizedHandler(async () => {
  try {
    await authService.refreshToken();
  } catch (_) {}
});

