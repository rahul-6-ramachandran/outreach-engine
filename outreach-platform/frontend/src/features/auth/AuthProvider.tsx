import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from './auth.api';
import { registerUnauthorizedListener } from '@/lib/api-client';
import { LoadingCard } from '@/components/common/LoadingState';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  loginError: string | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // In-memory authentication check via backend HttpOnly cookie validation
  const {
    data: authData,
    isLoading,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        return await authApi.getMe();
      } catch {
        return { authenticated: false };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  const isAuthenticated = !!authData?.authenticated;

  // Register listener for any unexpected 401s from API client
  React.useEffect(() => {
    registerUnauthorizedListener(() => {
      queryClient.setQueryData(['auth', 'me'], { authenticated: false });
    });
  }, [queryClient]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (password: string) => authApi.login({ password }),
    onSuccess: (data) => {
      setLoginError(null);
      queryClient.setQueryData(['auth', 'me'], data);
      const origin = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(origin, { replace: true });
    },
    onError: (error: { message?: string }) => {
      setLoginError(error.message || 'Authentication failed. Please check the password.');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], { authenticated: false });
      queryClient.clear(); // Clear cached queries on logout
      navigate('/login', { replace: true });
    },
  });

  const login = async (password: string) => {
    setLoginError(null);
    await loginMutation.mutateAsync(password);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        login,
        logout,
        isLoggingIn: loginMutation.isPending,
        isLoggingOut: logoutMutation.isPending,
        loginError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm">
          <LoadingCard rows={2} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <NavigateToLogin from={location} />;
  }

  return <>{children}</>;
}

function NavigateToLogin({ from }: { from: unknown }) {
  const navigate = useNavigate();
  React.useEffect(() => {
    navigate('/login', { state: { from }, replace: true });
  }, [navigate, from]);
  return null;
}
