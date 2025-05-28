import { useBusterNewChatContextSelector } from '@/context/Chats';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { renderHook } from '@testing-library/react';
import { useChatInputFlow } from './useChatInputFlow';

// Mock the context selectors
jest.mock('@/layouts/ChatLayout/ChatContext', () => ({
  useChatIndividualContextSelector: jest.fn()
}));

jest.mock('@/context/Chats', () => ({
  useBusterNewChatContextSelector: jest.fn()
}));

describe('useChatInputFlow', () => {
  const mockSetInputValue = jest.fn();
  const mockTextAreaRef = {
    current: {
      focus: jest.fn(),
      select: jest.fn(),
      value: '',
      type: 'textarea'
    } as unknown as HTMLTextAreaElement
  };
  const mockOnStartNewChat = jest.fn();
  const mockOnFollowUpChat = jest.fn();
  const mockOnStartChatFromFile = jest.fn();
  const mockOnStopChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useBusterNewChatContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        onStartNewChat: mockOnStartNewChat,
        onFollowUpChat: mockOnFollowUpChat,
        onStartChatFromFile: mockOnStartChatFromFile,
        onStopChat: mockOnStopChat
      };
      return selector(state);
    });
  });

  const defaultProps = {
    disableSubmit: false,
    inputValue: 'test message',
    setInputValue: mockSetInputValue,
    textAreaRef: mockTextAreaRef,
    loading: false
  };

  it('should handle followup-chat flow', async () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: true,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: null,
        selectedFileId: null
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow(defaultProps));

    await result.current.onSubmitPreflight();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockOnFollowUpChat).toHaveBeenCalledWith({
      prompt: 'test message',
      chatId: 'test-chat-id'
    });
    expect(mockSetInputValue).toHaveBeenCalledWith('');
    expect(mockTextAreaRef.current.focus).toHaveBeenCalled();
  });

  it('should handle followup-metric flow', async () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: false,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: 'metric',
        selectedFileId: 'test-metric-id'
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow(defaultProps));

    await result.current.onSubmitPreflight();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockOnStartChatFromFile).toHaveBeenCalledWith({
      prompt: 'test message',
      fileId: 'test-metric-id',
      fileType: 'metric'
    });
    expect(mockSetInputValue).toHaveBeenCalledWith('');
    expect(mockTextAreaRef.current.focus).toHaveBeenCalled();
  });

  it('should handle followup-dashboard flow', async () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: false,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: 'dashboard',
        selectedFileId: 'test-dashboard-id'
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow(defaultProps));

    await result.current.onSubmitPreflight();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockOnStartChatFromFile).toHaveBeenCalledWith({
      prompt: 'test message',
      fileId: 'test-dashboard-id',
      fileType: 'dashboard'
    });
    expect(mockSetInputValue).toHaveBeenCalledWith('');
    expect(mockTextAreaRef.current.focus).toHaveBeenCalled();
  });

  it('should handle new chat flow', async () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: false,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: null,
        selectedFileId: null
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow(defaultProps));

    await result.current.onSubmitPreflight();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockOnStartNewChat).toHaveBeenCalledWith({
      prompt: 'test message'
    });
    expect(mockSetInputValue).toHaveBeenCalledWith('');
    expect(mockTextAreaRef.current.focus).toHaveBeenCalled();
  });

  it('should handle stop chat', () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: true,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: null,
        selectedFileId: null
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow(defaultProps));

    result.current.onStopChat();

    expect(mockOnStopChat).toHaveBeenCalledWith({
      chatId: 'test-chat-id',
      messageId: 'test-message-id'
    });
    expect(mockTextAreaRef.current.focus).toHaveBeenCalled();
    expect(mockTextAreaRef.current.select).toHaveBeenCalled();
  });

  it('should not submit when disabled', async () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: true,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: null,
        selectedFileId: null
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow({ ...defaultProps, disableSubmit: true }));

    await result.current.onSubmitPreflight();

    expect(mockOnFollowUpChat).not.toHaveBeenCalled();
    expect(mockSetInputValue).not.toHaveBeenCalled();
    expect(mockTextAreaRef.current.focus).not.toHaveBeenCalled();
  });

  it('should stop chat when loading', async () => {
    (useChatIndividualContextSelector as jest.Mock).mockImplementation((selector) => {
      const state = {
        hasChat: true,
        chatId: 'test-chat-id',
        currentMessageId: 'test-message-id',
        selectedFileType: null,
        selectedFileId: null
      };
      return selector(state);
    });

    const { result } = renderHook(() => useChatInputFlow({ ...defaultProps, loading: true }));

    await result.current.onSubmitPreflight();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(mockOnStopChat).toHaveBeenCalled();
    expect(mockOnFollowUpChat).not.toHaveBeenCalled();
    expect(mockSetInputValue).not.toHaveBeenCalled();
  });
});
