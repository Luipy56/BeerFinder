import api from '../utils/axiosConfig';

// Version for localStorage keys
const VERSION = 'v1';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  password_confirm: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

/** Backend returns 200 with ok + tokens or ok false + detail (avoids 401 in console). */
interface LoginResponse {
  ok: boolean;
  access?: string;
  refresh?: string;
  detail?: string;
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<LoginResponse>('/auth/login/', credentials);
    if (!data.ok) {
      const err = new Error(data.detail || 'Login failed') as Error & { response: { status: number; data: { detail?: string } } };
      err.response = { status: 401, data: { detail: data.detail } };
      throw err;
    }
    const { access, refresh } = data;
    if (!access || !refresh) {
      const err = new Error('Invalid login response') as Error & { response: { status: number; data: { detail?: string } } };
      err.response = { status: 401, data: { detail: 'Error al iniciar sesión. Inténtalo de nuevo.' } };
      throw err;
    }
    try {
      localStorage.setItem(`access_token:${VERSION}`, access);
      localStorage.setItem(`refresh_token:${VERSION}`, refresh);
    } catch (e) {
      console.warn('Failed to store tokens in localStorage:', e);
    }
    return { access, refresh };
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/', userData);
    const { access, refresh } = response.data;
    
    // Store tokens with versioning and error handling
    try {
      localStorage.setItem(`access_token:${VERSION}`, access);
      localStorage.setItem(`refresh_token:${VERSION}`, refresh);
    } catch (error) {
      // Handle localStorage errors (incognito, quota exceeded, disabled)
      console.warn('Failed to store tokens in localStorage:', error);
    }
    
    return response.data;
  },

  refreshToken: async (): Promise<string> => {
    try {
      const refreshToken = localStorage.getItem(`refresh_token:${VERSION}`);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post<{ access: string }>('/auth/refresh/', {
        refresh: refreshToken,
      });
      
      const { access } = response.data;
      
      // Store new access token with versioning and error handling
      try {
        localStorage.setItem(`access_token:${VERSION}`, access);
      } catch (error) {
        console.warn('Failed to store access token in localStorage:', error);
      }
      
      return access;
    } catch (error) {
      // If refresh fails, clear tokens
      authService.logout();
      throw error;
    }
  },

  logout: (): void => {
    try {
      localStorage.removeItem(`access_token:${VERSION}`);
      localStorage.removeItem(`refresh_token:${VERSION}`);
    } catch (error) {
      // Handle localStorage errors
      console.warn('Failed to remove tokens from localStorage:', error);
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile/');
    return response.data;
  },

  updateProfile: async (userData: Partial<Pick<User, 'email'>>): Promise<User> => {
    const response = await api.patch<User>('/auth/profile/', userData);
    return response.data;
  },

  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(`access_token:${VERSION}`);
    } catch (error) {
      return null;
    }
  },

  getRefreshToken: (): string | null => {
    try {
      return localStorage.getItem(`refresh_token:${VERSION}`);
    } catch (error) {
      return null;
    }
  },
};

export default authService;
