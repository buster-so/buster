import type React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatResponseReasoning } from './ChatResponseReasoning';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { useQuery } from '@tanstack/react-query';

// Mock the imports
jest.mock('../../../ChatLayoutContext', () => ({
  useChatLayoutContextSelector: jest.fn()
}));

jest.mock('@/api/buster_rest/chats', () => ({
  useGetChatMessage: jest.fn()
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn()
}));

// Mock query keys
jest.mock('@/api/query_keys', () => ({
  queryKeys: {
    chatsBlackBoxMessages: jest.fn().mockReturnValue({
      queryKey: ['chats', 'blackBoxMessages'],
      notifyOnChangeProps: ['data']
    })
  }
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  );
});

// Mock routes
jest.mock('@/routes', () => ({
  BusterRoutes: {
    APP_CHAT_ID: '/app/chat/:chatId',
    APP_CHAT_ID_REASONING_ID: '/app/chat/:chatId/:messageId/reasoning'
  },
  createBusterRoute: jest.fn().mockImplementation(({ route, chatId, messageId }) => {
    if (route === '/app/chat/:chatId') {
      return `/app/chat/${chatId}`;
    }
    if (route === '/app/chat/:chatId/:messageId/reasoning') {
      return `/app/chat/${chatId}/${messageId}/reasoning`;
    }
    return '';
  })
}));

// Mock ShimmerText component
jest.mock('@/components/ui/typography/ShimmerText', () => ({
  ShimmerText: ({ text }: { text: string }) => <span data-testid="shimmer">{text}</span>
}));

// Mock Text component
jest.mock('@/components/ui/typography', () => ({
  Text: ({
    children,
    variant,
    className
  }: {
    children: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid="text" data-variant={variant} className={className}>
      {children}
    </span>
  )
}));

// Mock framer-motion components
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('ChatResponseReasoning', () => {
  const defaultProps = {
    reasoningMessageId: 'reasoning-id',
    finalReasoningMessage: undefined,
    isCompletedStream: false,
    messageId: 'message-id',
    chatId: 'chat-id'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('messageId')) return 'different-message-id';
      if (selector.toString().includes('selectedFileType')) return 'not-reasoning';
      return null;
    });

    // Mock useGetChatMessage with proper selector behavior
    (useGetChatMessage as jest.Mock).mockImplementation((id, options) => {
      if (options?.select?.toString().includes('reasoning_messages')) {
        return { data: 'Test Title' };
      }
      if (options?.select?.toString().includes('final_reasoning_message')) {
        return { data: null };
      }
      return { data: null };
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: null
    });
  });

  it('renders with default state showing ShimmerText', () => {
    render(<ChatResponseReasoning {...defaultProps} />);

    // We should have a link
    const link = screen.getByTestId('link');
    expect(link).toBeInTheDocument();

    // Since isCompletedStream is false and we're not in reasoning view, ShimmerText should be shown
    expect(screen.getByTestId('shimmer')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders Text component when stream is completed', () => {
    render(<ChatResponseReasoning {...defaultProps} isCompletedStream={true} />);

    // With completed stream, we should render Text component
    const textElement = screen.getByTestId('text');
    expect(textElement).toBeInTheDocument();
    expect(textElement).toHaveTextContent('Test Title');
    expect(screen.getByTestId('link')).toHaveAttribute(
      'href',
      '/app/chat/chat-id/message-id/reasoning'
    );
  });

  it('displays finalReasoningMessage when available', () => {
    (useGetChatMessage as jest.Mock).mockImplementation((id, options) => {
      if (options?.select?.toString().includes('reasoning_messages')) {
        return { data: 'Test Title' };
      }
      if (options?.select?.toString().includes('final_reasoning_message')) {
        return { data: 'Final reasoning message' };
      }
      return { data: null };
    });

    render(<ChatResponseReasoning {...defaultProps} isCompletedStream={true} />);

    expect(screen.getByText('Final reasoning message')).toBeInTheDocument();
  });

  it('displays blackBoxMessage when available', () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: 'Black box message'
    });

    render(<ChatResponseReasoning {...defaultProps} isCompletedStream={true} />);

    expect(screen.getByText('Black box message')).toBeInTheDocument();
  });

  it('renders with correct link when reasoning file is selected', () => {
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) => {
      if (selector.toString().includes('messageId')) return 'message-id';
      if (selector.toString().includes('selectedFileType')) return 'reasoning';
      return null;
    });

    render(<ChatResponseReasoning {...defaultProps} isCompletedStream={true} />);

    // When reasoning file is selected, link should point to chat without reasoning
    const link = screen.getByTestId('link');
    expect(link).toHaveAttribute('href', '/app/chat/chat-id');
  });

  it('renders "Thinking..." as fallback text', () => {
    (useGetChatMessage as jest.Mock).mockImplementation(() => ({ data: null }));
    (useQuery as jest.Mock).mockReturnValue({ data: null });

    render(<ChatResponseReasoning {...defaultProps} />);

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });
});
