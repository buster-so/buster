// Learn more: https://github.com/testing-library/jest-dom
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock environment variables
vi.mock('@/env', () => ({
  env: {
    VITE_PUBLIC_API2_URL: 'https://api2.test.com',
    VITE_PUBLIC_API_URL: 'https://api.test.com',
    VITE_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key',
    VITE_PUBLIC_SUPABASE_URL: 'https://supabase.test.com',
    VITE_PUBLIC_URL: 'https://test.com',
    VITE_PUBLIC_ENABLE_TANSTACK_PANEL: undefined,
    VITE_PUBLIC_POSTHOG_HOST: undefined,
    VITE_PUBLIC_POSTHOG_KEY: undefined,
    VITE_PUBLIC_USER: undefined,
    VITE_PUBLIC_USER_PASSWORD: undefined,
    VITE_PUBLIC_WEB_SOCKET_URL: undefined,
  },
}));

// Mock react-hotkeys-hook
vi.mock('react-hotkeys-hook', () => ({
  useHotkeys: vi.fn(),
}));

vi.mock('react-markdown', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('remark-gfm', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock Supabase client to prevent environment variable errors in tests
vi.mock('@/lib/supabase/client', () => {
  const mockClient = {
    auth: {
      refreshSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          },
        },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
          },
        },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  };

  return {
    createBrowserClient: vi.fn(() => mockClient),
    getBrowserClient: vi.fn(() => mockClient),
  };
});
