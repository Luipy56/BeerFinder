import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import authService, { User, LoginCredentials, RegisterData } from '../services/authService';

// Version for localStorage keys
const VERSION = 'v1';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Lazy state initialization - only reads from localStorage once on mount
  const [authState, setAuthState] = useState(() => {
    try {
      const token = localStorage.getItem(`access_token:${VERSION}`);
      return {
        isAuthenticated: !!token,
        isLoading: true,
      };
    } catch {
      return {
        isAuthenticated: false,
        isLoading: true,
      };
    }
  });

  const [user, setUser] = useState<User | null>(null);

  // Functional setState updates to prevent stale closures
  const updateAuthState = useCallback((updates: Partial<typeof authState>) => {
    setAuthState((curr) => ({ ...curr, ...updates }));
  }, []);

  const updateUser = useCallback((updates: User | null) => {
    setUser(() => updates);
  }, []);

  // Verify token and get user on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = authService.getAccessToken();
        if (token) {
          const userData = await authService.getCurrentUser();
          updateUser(userData);
          updateAuthState({ isAuthenticated: true, isLoading: false });
        } else {
          updateAuthState({ isAuthenticated: false, isLoading: false });
        }
      } catch (error) {
        // Token invalid, try refresh
        try {
          await authService.refreshToken();
          const userData = await authService.getCurrentUser();
          updateUser(userData);
          updateAuthState({ isAuthenticated: true, isLoading: false });
        } catch (refreshError) {
          // Refresh failed, clear state
          updateAuthState({ isAuthenticated: false, isLoading: false });
          updateUser(null);
        }
      }
    };

    verifyToken();
  }, [updateAuthState, updateUser]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await authService.login(credentials);
      // Fetch user profile after login to ensure we have complete user data
      const userData = await authService.getCurrentUser();
      updateUser(userData);
      updateAuthState({ isAuthenticated: true, isLoading: false });
    } catch (error) {
      updateAuthState({ isLoading: false });
      throw error;
    }
  }, [updateAuthState, updateUser]);

  const register = useCallback(async (userData: RegisterData) => {
    try {
      const response = await authService.register(userData);
      updateUser(response.user || null);
      updateAuthState({ isAuthenticated: true, isLoading: false });
    } catch (error) {
      updateAuthState({ isLoading: false });
      throw error;
    }
  }, [updateAuthState, updateUser]);

  const logout = useCallback(() => {
    authService.logout();
    updateUser(null);
    updateAuthState({ isAuthenticated: false, isLoading: false });
  }, [updateAuthState, updateUser]);

  const refreshToken = useCallback(async () => {
    try {
      await authService.refreshToken();
      const userData = await authService.getCurrentUser();
      updateUser(userData);
      updateAuthState({ isAuthenticated: true });
    } catch (error) {
      updateUser(null);
      updateAuthState({ isAuthenticated: false });
      throw error;
    }
  }, [updateAuthState, updateUser]);

  const value: AuthContextType = {
    user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
