import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePageController } from './HomePageController';

// Mock the dependencies
vi.mock('@/api/buster_rest/users/useGetUserInfo', () => ({
  useGetUserBasicInfo: vi.fn(),
}));

vi.mock('./useNewChatWarning', () => ({
  useNewChatWarning: vi.fn(),
}));

vi.mock('./NewChatWarning', () => ({
  NewChatWarning: vi.fn(({ showWarning, hasDatasets, hasDatasources, isAdmin }) => (
    <div data-testid="new-chat-warning">
      Warning Component - showWarning: {showWarning.toString()}, hasDatasets:{' '}
      {hasDatasets.toString()}, hasDatasources: {hasDatasources.toString()}, isAdmin:{' '}
      {isAdmin?.toString() || 'undefined'}
    </div>
  )),
}));

vi.mock('./NewChatInput', () => ({
  NewChatInput: vi.fn(({ initialValue, autoSubmit }) => (
    <div data-testid="new-chat-input">
      Chat Input - initialValue: {initialValue || 'none'}, autoSubmit:{' '}
      {autoSubmit?.toString() || 'false'}
    </div>
  )),
}));

// Mock ClientOnly to render children directly in tests
vi.mock('@tanstack/react-router', () => ({
  ClientOnly: vi.fn(({ children }) => <>{children}</>),
}));

import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { useNewChatWarning } from './useNewChatWarning';

const mockUseGetUserBasicInfo = vi.mocked(useGetUserBasicInfo);
const mockUseNewChatWarning = vi.mocked(useNewChatWarning);

describe('HomePageController', () => {
  beforeEach(() => {
    // Default user info
    mockUseGetUserBasicInfo.mockReturnValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar_url: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
      attributes: {
        organization_id: 'org-1',
        organization_role: 'querier',
        user_email: 'john.doe@example.com',
        user_id: 'user-1',
      },
      favorites: [],
    });

    // Mock time to ensure consistent greeting
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01 10:00:00')); // 10 AM - morning
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should render NewChatWarning when showWarning is true', () => {
    // Mock the hook to return showWarning: true
    mockUseNewChatWarning.mockReturnValue({
      showWarning: true,
      hasDatasets: false,
      hasDatasources: false,
      isFetched: true,
      isAdmin: true,
      userRole: 'workspace_admin',
    });

    render(<HomePageController initialValue="test" autoSubmit={true} />);

    // Should show the warning component
    expect(screen.getByTestId('new-chat-warning')).toBeInTheDocument();
    expect(screen.getByText(/Warning Component.*showWarning: true/)).toBeInTheDocument();

    // Should NOT show the main interface components
    expect(screen.queryByTestId('new-chat-input')).not.toBeInTheDocument();
    expect(screen.queryByText('Good morning, John Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('How can I help you today?')).not.toBeInTheDocument();
  });

  it('should render main interface when showWarning is false', () => {
    // Mock the hook to return showWarning: false
    mockUseNewChatWarning.mockReturnValue({
      showWarning: false,
      hasDatasets: true,
      hasDatasources: true,
      isFetched: true,
      isAdmin: false,
      userRole: 'querier',
    });

    render(<HomePageController initialValue="hello world" autoSubmit={false} />);

    // Should show the main interface components
    expect(screen.getByText('Good morning, John Doe')).toBeInTheDocument();
    expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
    expect(screen.getByTestId('new-chat-input')).toBeInTheDocument();
    expect(
      screen.getByText(/Chat Input.*initialValue: hello world.*autoSubmit: false/)
    ).toBeInTheDocument();

    // Should NOT show the warning component
    expect(screen.queryByTestId('new-chat-warning')).not.toBeInTheDocument();
  });

  it('should pass correct props to NewChatInput', () => {
    mockUseNewChatWarning.mockReturnValue({
      showWarning: false,
      hasDatasets: true,
      hasDatasources: true,
      isFetched: true,
      isAdmin: false,
      userRole: 'querier',
    });

    render(<HomePageController initialValue="custom input" autoSubmit={true} />);

    expect(
      screen.getByText(/Chat Input.*initialValue: custom input.*autoSubmit: true/)
    ).toBeInTheDocument();
  });

  it('should pass all newChatWarningProps to NewChatWarning', () => {
    const warningProps = {
      showWarning: true,
      hasDatasets: false,
      hasDatasources: true,
      isFetched: true,
      isAdmin: true,
      userRole: 'workspace_admin' as const,
    };

    mockUseNewChatWarning.mockReturnValue(warningProps);

    render(<HomePageController />);

    expect(
      screen.getByText(
        /Warning Component.*showWarning: true.*hasDatasets: false.*hasDatasources: true.*isAdmin: true/
      )
    ).toBeInTheDocument();
  });

  describe('greeting logic', () => {
    beforeEach(() => {
      mockUseNewChatWarning.mockReturnValue({
        showWarning: false,
        hasDatasets: true,
        hasDatasources: true,
        isFetched: true,
        isAdmin: false,
        userRole: 'querier',
      });
    });

    it('should show morning greeting at 10 AM', () => {
      vi.setSystemTime(new Date('2023-01-01 10:00:00'));
      render(<HomePageController />);
      expect(screen.getByText('Good morning, John Doe')).toBeInTheDocument();
    });

    it('should show afternoon greeting at 3 PM', () => {
      vi.setSystemTime(new Date('2023-01-01 15:00:00'));
      render(<HomePageController />);
      expect(screen.getByText('Good afternoon, John Doe')).toBeInTheDocument();
    });

    it('should show evening greeting at 8 PM', () => {
      vi.setSystemTime(new Date('2023-01-01 20:00:00'));
      render(<HomePageController />);
      expect(screen.getByText('Good evening, John Doe')).toBeInTheDocument();
    });

    it('should show night greeting at 2 AM', () => {
      vi.setSystemTime(new Date('2023-01-01 02:00:00'));
      render(<HomePageController />);
      expect(screen.getByText('Good night, John Doe')).toBeInTheDocument();
    });
  });
});
