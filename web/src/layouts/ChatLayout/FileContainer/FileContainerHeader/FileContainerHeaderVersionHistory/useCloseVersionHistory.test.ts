import { useAppLayoutContextSelector } from '@/context/BusterAppLayout/AppLayoutProvider';
import { useGetInitialChatFile } from '@/layouts/ChatLayout/ChatContext/useGetInitialChatFile';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext/ChatLayoutContext';
import { renderHook } from '@testing-library/react';
import { useCloseVersionHistory } from './useCloseVersionHistory';

// Mock the dependencies
jest.mock('@/context/BusterAppLayout/AppLayoutProvider');
jest.mock('@/layouts/ChatLayout/ChatContext/useGetInitialChatFile');
jest.mock('@/layouts/ChatLayout/ChatLayoutContext/ChatLayoutContext');

describe('useCloseVersionHistory', () => {
  const mockOnChangePage = jest.fn();
  const mockGetInitialChatFileHref = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useAppLayoutContextSelector
    (useAppLayoutContextSelector as jest.Mock).mockImplementation((selector) => {
      return selector({ onChangePage: mockOnChangePage });
    });

    // Mock useGetInitialChatFile
    (useGetInitialChatFile as jest.Mock).mockReturnValue(mockGetInitialChatFileHref);
  });

  it('should be true', () => {
    expect(true).toBe(true);
  });

  it('should return correct href when chatId is present', () => {
    const expectedHref = '/chat/chat-123/metric/metric-123';
    mockGetInitialChatFileHref.mockReturnValue(expectedHref);

    // Mock chat layout context values
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) =>
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
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) =>
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
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) =>
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
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) =>
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
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) =>
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
