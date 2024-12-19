import { useState, useCallback, useEffect } from 'react';
import AuthService from '../services/authService';

export const useGoogleAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkAuth = () => {
      const isAuth = authService.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const startAuth = useCallback(async () => {
    try {
      setError(null);
      const authUrl = await authService.getAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to start authentication');
      throw err;
    }
  }, []);

  const handleAuthCallback = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      await authService.handleCallback(code);
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      setError('Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.clearTokens();
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    isLoading,
    error,
    startAuth,
    handleAuthCallback,
    logout
  };
};