import React from 'react';
import { AppState, Platform } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AuthProvider } from '@/src/providers/AuthProvider';
import { ErrorBoundary } from '@/src/providers/ErrorBoundary';

/**
 * Single composition root for app-wide providers.
 * Order matters: ErrorBoundary wraps everything so provider crashes are
 * caught too; QueryClient sits above Auth because auth hooks use mutations.
 */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
      networkMode: 'online',
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});

// Drive TanStack's focus manager from RN's AppState so `refetchOnWindowFocus`
// works on native (list screens refresh when the user returns to the app).
if (Platform.OS !== 'web') {
  focusManager.setEventListener(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  });
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export { queryClient };
