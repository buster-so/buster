import { useAppLayoutContextSelector } from '@/context/BusterAppLayout/AppLayoutProvider';
import { useGetInitialChatFile } from '@/layouts/ChatLayout/ChatContext/useGetInitialChatFile';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext/ChatLayoutContext';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCloseVersionHistory } from './useCloseVersionHistory';

// Mock the dependencies
vi.mock('@/context/BusterAppLayout/AppLayoutProvider');
vi.mock('@/layouts/ChatLayout/ChatContext/useGetInitialChatFile');
vi.mock('@/layouts/ChatLayout/ChatLayoutContext/ChatLayoutContext');

describe('useCloseVersionHistory', () => {
  const mockOnChangePage = vi.fn();
  const mockGetInitialChatFileHref = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAppLayoutContextSelector
    (useAppLayoutContextSelector as any).mockImplementation((selector: any) => {
      return selector({ onChangePage: mockOnChangePage });
    });

    // Mock useGetInitialChatFile
    (useGetInitialChatFile as any).mockReturnValue(mockGetInitialChatFileHref);
  });

  it('should be true', () => {
    expect(true).toBe(true);
  });

  it('should return correct href when chatId is present', () => {
    const expectedHref = '/chat/chat-123/metric/metric-123';
    mockGetInitialChatFileHref.mockReturnValue(expectedHref);

    // Mock chat layout context values
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) =>
      selector({
        chatId: 'chat-123',
        metricId: 'metric-123',
        dashboardId: 'dashboard-123',
        messageId: 'message-123'
      })
    );

    const { result } = renderHook(() => useCloseVersionHistory());

    expect(result.current.href).toBe(expectedHref);
    expect(mockGetInitialChatFileHref).toHaveBeenCalledWith({
      metricId: 'metric-123',
      dashboardId: 'dashboard-123',
      chatId: 'chat-123',
      dashboardVersionNumber: undefined,
      metricVersionNumber: undefined,
      messageId: 'message-123',
      currentRoute: undefined
    });
  });

  it('should return error href when getInitialChatFileHref returns falsy', () => {
    mockGetInitialChatFileHref.mockReturnValue(null);

    // Mock chat layout context values
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) =>
      selector({
        chatId: 'chat-123',
        metricId: 'metric-123',
        dashboardId: 'dashboard-123',
        messageId: 'message-123'
      })
    );

    const { result } = renderHook(() => useCloseVersionHistory());

    expect(result.current.href).toBe('error');
  });

  it('should call onChangePage with correct href when onCloseVersionHistory is called', () => {
    const expectedHref = '/chat/chat-123/metric/metric-123';
    mockGetInitialChatFileHref.mockReturnValue(expectedHref);

    // Mock chat layout context values
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) =>
      selector({
        chatId: 'chat-123',
        metricId: 'metric-123',
        dashboardId: 'dashboard-123',
        messageId: 'message-123'
      })
    );

    const { result } = renderHook(() => useCloseVersionHistory());
    result.current.onCloseVersionHistory();

    expect(mockOnChangePage).toHaveBeenCalledWith(expectedHref);
  });

  it('should return correct href when chatId is not present', () => {
    // Mock chat layout context values
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) =>
      selector({
        chatId: undefined,
        metricId: 'metric-123',
        dashboardId: undefined,
        messageId: undefined
      })
    );

    const { result } = renderHook(() => useCloseVersionHistory());

    // Verify the href matches the expected route structure for metrics
    expect(result.current.href).toBe('/app/metrics/metric-123/chart');
    expect(mockGetInitialChatFileHref).not.toHaveBeenCalled();
  });

  it('should return correct href when chatId is not present and onCloseVersionHistory is called', () => {
    const expectedHref = '/app/metrics/metric-123/chart';
    mockGetInitialChatFileHref.mockReturnValue(expectedHref);

    // Mock chat layout context values
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) =>
      selector({
        chatId: undefined,
        metricId: 'metric-123',
        dashboardId: undefined,
        messageId: undefined
      })
    );

    const { result } = renderHook(() => useCloseVersionHistory());
    result.current.onCloseVersionHistory();

    expect(mockOnChangePage).toHaveBeenCalledWith(expectedHref);
  });
});
