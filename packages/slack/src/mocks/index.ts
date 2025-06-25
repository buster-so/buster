import { vi } from 'vitest';

export type MockWebClient = {
  auth: {
    test: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
  };
  chat: {
    postMessage: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  conversations: {
    list: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    join: ReturnType<typeof vi.fn>;
    leave: ReturnType<typeof vi.fn>;
    replies: ReturnType<typeof vi.fn>;
  };
};

export function createMockWebClient(): MockWebClient {
  return {
    auth: {
      test: vi.fn(),
      revoke: vi.fn(),
    },
    chat: {
      postMessage: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    conversations: {
      list: vi.fn(),
      info: vi.fn(),
      join: vi.fn(),
      leave: vi.fn(),
      replies: vi.fn(),
    },
  };
}
