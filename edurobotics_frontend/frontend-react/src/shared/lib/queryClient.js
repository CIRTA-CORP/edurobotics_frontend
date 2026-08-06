/**
 * Shared React Query client. Defaults tuned for this app: data stays fresh 30s
 * (matches the API cache), kept in memory 5min, one retry, and no refetch on
 * window focus (progress is refreshed explicitly instead).
 */
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
