import { apiClient } from '@/lib/api-client';
import { type AuthStatus, type LoginPayload } from './auth.types';

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthStatus> => {
    return apiClient<AuthStatus>('/auth/login', {
      method: 'POST',
      body: payload,
    });
  },

  getMe: async (): Promise<AuthStatus> => {
    return apiClient<AuthStatus>('/auth/me', {
      method: 'GET',
    });
  },

  logout: async (): Promise<AuthStatus> => {
    return apiClient<AuthStatus>('/auth/logout', {
      method: 'POST',
    });
  },
};
