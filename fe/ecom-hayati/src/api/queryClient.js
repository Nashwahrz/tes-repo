import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ulangi hanya untuk gangguan jaringan
      retry: (count, err) => count < 1 && !err?.response,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  },
});
