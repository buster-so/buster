import type { ShareAssetType, ShareConfig } from '@buster/server-shared/share';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShareMenuInvite } from './ShareMenuInvite';

// Create mock functions
const mockShareMetric = vi.fn();
const mockShareDashboard = vi.fn();
const mockShareCollection = vi.fn();
const mockShareChat = vi.fn();
const mockShareReport = vi.fn();
const mockOpenErrorMessage = vi.fn();

// Mock hooks
vi.mock('@/api/buster_rest/chats', () => ({
  useShareChat: () => ({
    mutateAsync: mockShareChat,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/collections', () => ({
  useShareCollection: () => ({
    mutateAsync: mockShareCollection,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/dashboards', () => ({
  useShareDashboard: () => ({
    mutateAsync: mockShareDashboard,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/metrics', () => ({
  useShareMetric: () => ({
    mutateAsync: mockShareMetric,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/reports', () => ({
  useShareReport: () => ({
    mutateAsync: mockShareReport,
    isPending: false,
  }),
}));

vi.mock('../../../api/buster_rest/users', () => ({
  useGetUserToOrganization: () => ({
    data: {
      data: [
        {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
        },
      ],
    },
  }),
}));

vi.mock('@/context/BusterNotifications', () => ({
  useBusterNotifications: () => ({
    openErrorMessage: mockOpenErrorMessage,
  }),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('@/hooks/useMemoizedFn', () => ({
  useMemoizedFn: (fn: any) => fn,
}));

vi.mock('@/lib/email', () => ({
  isValidEmail: (email: string) => email.includes('@') && email.includes('.'),
}));

vi.mock('@/lib/text', () => ({
  inputHasText: (text: string) => text.length > 0,
}));

// Mock components
vi.mock('../../ui/avatar/AvatarUserButton', () => ({
  AvatarUserButton: ({ username, email }: { username: string; email: string }) => (
    <div data-testid="avatar-user-button">
      {username} - {email}
    </div>
  ),
}));

vi.mock('./AccessDropdown', () => ({
  AccessDropdown: ({ shareLevel, onChangeShareLevel }: any) => (
    <div data-testid="access-dropdown">
      <button onClick={() => onChangeShareLevel('can_edit')} type="button">
        Change to Edit
      </button>
      <span>Current: {shareLevel}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/inputs/InputSearchDropdown', () => ({
  InputSearchDropdown: ({ value, onChange, onPressEnter, placeholder }: any) => (
    <input
      data-testid="email-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onPressEnter()}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('@/components/ui/buttons', () => ({
  Button: ({ children, onClick, disabled, loading }: any) => (
    <button
      data-testid="invite-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={loading ? 'Loading' : undefined}
      type="button"
    >
      {children}
    </button>
  ),
}));

const renderComponent = (props: {
  assetType: ShareAssetType;
  assetId: string;
  individualPermissions: ShareConfig['individual_permissions'];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ShareMenuInvite {...props} />
    </QueryClientProvider>
  );
};

describe('ShareMenuInvite', () => {
  const defaultProps = {
    assetType: 'metric_file' as ShareAssetType,
    assetId: 'test-asset-id',
    individualPermissions: [] as ShareConfig['individual_permissions'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render email input and invite button', () => {
    renderComponent(defaultProps);

    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('invite-button')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Invite others by email...')).toBeInTheDocument();
  });

  it('should disable invite button when email input is empty or invalid', () => {
    renderComponent(defaultProps);

    const inviteButton = screen.getByTestId('invite-button');
    expect(inviteButton).toBeDisabled();

    // Type invalid email
    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    expect(inviteButton).toBeDisabled();
  });

  it('should enable invite button when valid email is entered', () => {
    renderComponent(defaultProps);

    const emailInput = screen.getByTestId('email-input');
    const inviteButton = screen.getByTestId('invite-button');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(inviteButton).not.toBeDisabled();
  });

  it('should show access dropdown when email is entered', () => {
    renderComponent(defaultProps);

    const emailInput = screen.getByTestId('email-input');

    // Initially no access dropdown
    expect(screen.queryByTestId('access-dropdown')).not.toBeInTheDocument();

    // Type email to show dropdown
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(screen.getByTestId('access-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Current: can_view')).toBeInTheDocument();
  });

  it('should show error when trying to invite already shared email', () => {
    const propsWithExistingPermissions = {
      ...defaultProps,
      individualPermissions: [
        {
          email: 'existing@example.com',
          role: 'can_view' as const,
          name: 'Existing User',
          avatar_url: null,
        },
      ] as ShareConfig['individual_permissions'],
    };

    renderComponent(propsWithExistingPermissions);

    const emailInput = screen.getByTestId('email-input');
    const inviteButton = screen.getByTestId('invite-button');

    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.click(inviteButton);

    expect(mockOpenErrorMessage).toHaveBeenCalledWith('Email already shared');
  });
});
