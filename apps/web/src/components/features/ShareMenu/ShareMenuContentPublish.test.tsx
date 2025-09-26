import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import type { ShareMenuContentBodyProps } from './ShareMenuContentBody';
import { ShareMenuContentPublish } from './ShareMenuContentPublish';

// Mock all external dependencies
const mockOnShareMetric = vi.fn();
const mockOnShareDashboard = vi.fn();
const mockOnShareCollection = vi.fn();
const mockOnShareReport = vi.fn();
const mockOnShareChat = vi.fn();
const mockOnCopyLink = vi.fn();
const mockTimeout = vi.fn().mockResolvedValue(true);

// Mock the timeout utility
vi.mock('@/lib/timeout', () => ({
  timeout: (time?: number) => mockTimeout(time),
}));

describe('onTogglePublish', () => {
  const baseProps = {
    assetId: 'test-asset-id',
    password: 'test-password',
    publicly_accessible: false,
    onCopyLink: mockOnCopyLink,
    publicExpirationDate: null,
    embedLinkURL: 'https://example.com/embed',
  } satisfies Partial<ShareMenuContentBodyProps>;

  const baseDate = new Date('2023-12-25T10:00:00Z');
  const linkExpiry = baseDate;

  // Helper function to create the onTogglePublish function with mocked dependencies
  const createOnTogglePublish = (
    assetType: ShareMenuContentBodyProps['assetType'],
    _password = 'test-password',
    linkExpiryParam: Date | null = null
  ) => {
    return async (v?: boolean) => {
      const linkExp = linkExpiryParam ? linkExpiryParam.toISOString() : null;
      const payload = {
        id: baseProps.assetId,
        params: {
          publicly_accessible: v === undefined ? true : !!v,
          public_password: _password || undefined,
          public_expiry_date: linkExp || undefined,
        },
      };

      if (assetType === 'metric_file') {
        await mockOnShareMetric(payload);
      } else if (assetType === 'dashboard_file') {
        await mockOnShareDashboard(payload);
      } else if (assetType === 'collection') {
        await mockOnShareCollection(payload);
      } else if (assetType === 'report_file') {
        await mockOnShareReport(payload);
      } else if (assetType === 'chat') {
        await mockOnShareChat(payload);
      } else {
        const _exhaustiveCheck: never = assetType;
      }
      await mockTimeout(100);
      if (v) mockOnCopyLink(true);
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call onShareMetric for metric_file asset type with default publicly_accessible true', async () => {
    const onTogglePublish = createOnTogglePublish('metric_file');

    await onTogglePublish();

    expect(mockOnShareMetric).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: 'test-password',
        public_expiry_date: undefined,
      },
    });
    expect(mockTimeout).toHaveBeenCalledWith(100);
    expect(mockOnCopyLink).not.toHaveBeenCalled();
  });

  it('should call onShareDashboard for dashboard_file asset type with explicit true value', async () => {
    const onTogglePublish = createOnTogglePublish(
      'dashboard_file',
      'dashboard-password',
      linkExpiry
    );

    await onTogglePublish(true);

    expect(mockOnShareDashboard).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: 'dashboard-password',
        public_expiry_date: '2023-12-25T10:00:00.000Z',
      },
    });
    expect(mockTimeout).toHaveBeenCalledWith(100);
    expect(mockOnCopyLink).toHaveBeenCalledWith(true);
  });

  it('should call onShareCollection for collection asset type with false value', async () => {
    const onTogglePublish = createOnTogglePublish('collection');

    await onTogglePublish(false);

    expect(mockOnShareCollection).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: false,
        public_password: 'test-password',
        public_expiry_date: undefined,
      },
    });
    expect(mockTimeout).toHaveBeenCalledWith(100);
    expect(mockOnCopyLink).not.toHaveBeenCalled();
  });

  it('should call onShareReport for report_file asset type', async () => {
    const onTogglePublish = createOnTogglePublish('report_file');

    await onTogglePublish();

    expect(mockOnShareReport).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: 'test-password',
        public_expiry_date: undefined,
      },
    });
    expect(mockTimeout).toHaveBeenCalledWith(100);
  });

  it('should call onShareChat for chat asset type', async () => {
    const onTogglePublish = createOnTogglePublish('chat');

    await onTogglePublish();

    expect(mockOnShareChat).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: 'test-password',
        public_expiry_date: undefined,
      },
    });
    expect(mockTimeout).toHaveBeenCalledWith(100);
  });

  it('should handle empty password by setting public_password to undefined', async () => {
    const onTogglePublish = createOnTogglePublish('metric_file', '');

    await onTogglePublish();

    expect(mockOnShareMetric).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: undefined,
        public_expiry_date: undefined,
      },
    });
  });

  it('should handle null linkExpiry by setting public_expiry_date to null', async () => {
    const onTogglePublish = createOnTogglePublish('dashboard_file', 'password', null);

    await onTogglePublish();

    expect(mockOnShareDashboard).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: 'password',
        public_expiry_date: undefined,
      },
    });
  });

  it('should convert linkExpiry Date to ISO string', async () => {
    const testDate = new Date('2024-01-15T15:30:00Z');
    const onTogglePublish = createOnTogglePublish('collection', 'password', testDate);

    await onTogglePublish();

    expect(mockOnShareCollection).toHaveBeenCalledWith({
      id: 'test-asset-id',
      params: {
        publicly_accessible: true,
        public_password: 'password',
        public_expiry_date: '2024-01-15T15:30:00.000Z',
      },
    });
  });

  it('should call onCopyLink when v is truthy', async () => {
    const onTogglePublish = createOnTogglePublish('metric_file');

    await onTogglePublish(true);

    expect(mockOnCopyLink).toHaveBeenCalledWith(true);
  });

  it('should not call onCopyLink when v is falsy', async () => {
    const onTogglePublish = createOnTogglePublish('metric_file');

    await onTogglePublish(false);

    expect(mockOnCopyLink).not.toHaveBeenCalled();
  });
});

// Mock all the hooks for React component tests
vi.mock('@/api/buster_rest/chats', () => ({
  useUpdateChatShare: () => ({
    mutateAsync: mockOnShareChat,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/collections', () => ({
  useUpdateCollectionShare: () => ({
    mutateAsync: mockOnShareCollection,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/dashboards', () => ({
  useUpdateDashboardShare: () => ({
    mutateAsync: mockOnShareDashboard,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/metrics', () => ({
  useUpdateMetricShare: () => ({
    mutateAsync: mockOnShareMetric,
    isPending: false,
  }),
}));

vi.mock('@/api/buster_rest/reports', () => ({
  useUpdateReportShare: () => ({
    mutateAsync: mockOnShareReport,
    isPending: false,
  }),
}));

vi.mock('@/context/BusterNotifications', () => ({
  useBusterNotifications: () => ({
    openInfoMessage: vi.fn(),
  }),
}));

vi.mock('@/context/Routes/useRouteBuilder', () => ({
  useBuildLocation: () => vi.fn(),
}));

describe('ShareMenuContentPublish Component', () => {
  const defaultProps: ShareMenuContentBodyProps = {
    assetType: 'metric_file',
    assetId: 'test-asset-id',
    password: '',
    publicly_accessible: false,
    onCopyLink: mockOnCopyLink,
    publicExpirationDate: null,
    className: '',
    embedLinkURL: 'https://example.com/embed/test-asset-id',
    individual_permissions: [],
    canEditPermissions: true,
    shareAssetConfig: {
      individual_permissions: [],
      publicly_accessible: false,
      public_expiry_date: null,
      public_password: '',
      permission: 'owner',
      workspace_sharing: null,
      public_enabled_by: null,
      workspace_member_count: null,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render create public link button when not publicly accessible', () => {
    render(<ShareMenuContentPublish {...defaultProps} />);

    expect(screen.getByText('Anyone with the link will be able to view.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create public link' })).toBeInTheDocument();
  });

  it('should render published state with link input when publicly accessible', () => {
    const props = {
      ...defaultProps,
      publicly_accessible: true,
    };

    render(<ShareMenuContentPublish {...props} />);

    expect(screen.getByText('Live on the web')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com/embed/test-asset-id')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('should show password protection controls when publicly accessible', () => {
    const props = {
      ...defaultProps,
      publicly_accessible: true,
    };

    render(<ShareMenuContentPublish {...props} />);

    expect(screen.getByText('Set a password')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('should enable password input when password protection is toggled on', async () => {
    const props = {
      ...defaultProps,
      publicly_accessible: true,
    };

    render(<ShareMenuContentPublish {...props} />);

    const passwordSwitch = screen.getByRole('switch');
    fireEvent.click(passwordSwitch);

    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('should show password input with existing password when password is provided', () => {
    const props = {
      ...defaultProps,
      publicly_accessible: true,
      password: 'existing-password',
    };

    render(<ShareMenuContentPublish {...props} />);

    // Password switch should be checked
    expect(screen.getByRole('switch')).toBeChecked();
    // Password input should be visible with the existing password
    expect(screen.getByDisplayValue('existing-password')).toBeInTheDocument();
  });
});
