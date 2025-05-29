import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import { useGetChatMessage } from '@/api/buster_rest/chats';
import { useQuery } from '@tanstack/react-query';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import { ChatResponseReasoning } from './ChatResponseReasoning';

// Mock the imports
vi.mock('../../../ChatLayoutContext', () => ({
  useChatLayoutContextSelector: vi.fn()
}));

vi.mock('@/api/buster_rest/chats', () => ({
  useGetChatMessage: vi.fn()
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn()
}));

// Mock query keys
vi.mock('@/api/query_keys', () => ({
  queryKeys: {
    chatsBlackBoxMessages: vi.fn().mockReturnValue({
      queryKey: ['chats', 'blackBoxMessages'],
      notifyOnChangeProps: ['data']
    })
  }
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href} data-testid="link">
      {children}
    </a>
  )
}));

// Mock routes
vi.mock('@/routes', () => ({
  BusterRoutes: {
    APP_CHAT_ID: '/app/chat/:chatId',
    APP_CHAT_ID_REASONING_ID: '/app/chat/:chatId/:messageId/reasoning'
  },
  createBusterRoute: vi.fn().mockImplementation(({ route, chatId, messageId }) => {
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
vi.mock('@/components/ui/typography/ShimmerText', () => ({
  ShimmerText: ({ text }: { text: string }) => <span data-testid="shimmer">{text}</span>
}));

// Mock Text component
vi.mock('@/components/ui/typography', () => ({
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
vi.mock('framer-motion', () => ({
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
    vi.clearAllMocks();

    // Default mock implementation
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) => {
      if (selector.toString().includes('messageId')) return 'different-message-id';
      if (selector.toString().includes('selectedFileType')) return 'not-reasoning';
      return null;
    });

    // Mock useGetChatMessage with proper selector behavior
    (useGetChatMessage as any).mockImplementation((id: any, options: any) => {
      if (options?.select?.toString().includes('reasoning_messages')) {
        return { data: 'Test Title' };
      }
      if (options?.select?.toString().includes('final_reasoning_message')) {
        return { data: null };
      }
      return { data: null };
    });

    (useQuery as any).mockReturnValue({
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
    (useGetChatMessage as any).mockImplementation((id: any, options: any) => {
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
    (useQuery as any).mockReturnValue({
      data: 'Black box message'
    });

    render(<ChatResponseReasoning {...defaultProps} isCompletedStream={true} />);

    expect(screen.getByText('Black box message')).toBeInTheDocument();
  });

  it('renders with correct link when reasoning file is selected', () => {
    (useChatLayoutContextSelector as any).mockImplementation((selector: any) => {
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
    (useGetChatMessage as any).mockImplementation(() => ({ data: null }));
    (useQuery as any).mockReturnValue({ data: null });

    render(<ChatResponseReasoning {...defaultProps} />);

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
  });
});
