import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/types/api.types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: (failureCount, error) => {
        if (isApiError(error)) {
          // Never retry authentication or client not found errors
          if ([401, 403, 404].includes(error.statusCode)) {
            return false;
          }
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
