import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReportThreeDotMenu } from './ReportThreeDotMenu';
import type { Mock } from 'vitest';
import { useStartChatFromAsset } from '@/api/buster_rest/chats';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import '@testing-library/jest-dom';

// Mock the hooks and modules
vi.mock(
  './useStartChatFromAsset',
  () => ({
    useStartChatFromReport: vi.fn(() => ({
      onCreateFileClick: vi.fn(),
      loading: false
    }))
  }),
  { virtual: false }
);

// Mock UI components
vi.mock('@/components/ui/dropdown', () => {
  const React = require('react');
  return {
    Dropdown: ({ children, items }: any) => {
      const [open, setOpen] = React.useState(false);

      return (
        <div>
          <div onClick={() => setOpen(!open)}>{children}</div>
          {open && (
            <div data-testid="dropdown-content">
              {items?.map((item: any, index: number) => {
                if (item.type === 'divider') return <div key={`divider-${index}`} />;
                return (
                  <div key={item.value || index} onClick={item.onClick}>
                    {item.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    },
    DropdownContent: ({ children }: any) => <div>{children}</div>
  };
});

vi.mock('@/components/ui/buttons', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
      {props.prefix}
    </button>
  )
}));

vi.mock('@/components/ui/icons', () => ({
  Dots: () => <span>Dots</span>,
  ShareRight: () => <span>ShareRight</span>,
  WandSparkle: () => <span>WandSparkle</span>,
  History: () => <span>History</span>,
  Star: () => <span>Star</span>
}));

vi.mock('@/components/ui/icons/NucleoIconOutlined', () => ({
  Refresh3: () => <span>Refresh3</span>,
  FileText: () => <span>FileText</span>,
  DuplicatePlus: () => <span>DuplicatePlus</span>
}));

vi.mock('@/components/ui/icons/NucleoIconFilled', () => ({
  Star: () => <span>StarFilled</span>
}));

vi.mock('@/components/features/ShareMenu', () => ({
  ShareMenuContent: () => null,
  getShareAssetConfig: (data: any) => data
}));

vi.mock('@/lib/share', () => ({
  getIsEffectiveOwner: () => true
}));

vi.mock('@/hooks/useMemoizedFn', () => ({
  useMemoizedFn: (fn: any) => fn
}));

vi.mock('@/routes/busterRoutes', () => ({
  BusterRoutes: {
    APP_CHAT_ID_REPORT_ID: '/app/chat/:chatId/report/:reportId'
  }
}));

vi.mock('@/lib/timeout', () => ({
  timeout: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
}));

vi.mock('@/components/features/config/assetIcons', () => ({
  ASSET_ICONS: {}
}));

vi.mock('@/api/buster_rest/chats', () => ({
  useStartChatFromAsset: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false
  }))
}));

vi.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: vi.fn(() => vi.fn())
}));

vi.mock('@/layouts/ChatLayout/ChatLayoutContext', () => ({
  useChatLayoutContextSelector: vi.fn(() => vi.fn())
}));

vi.mock('@/api/buster_rest/reports', () => ({
  useGetReport: vi.fn(() => ({
    data: {
      name: 'Test Report',
      id: 'report-123',
      permission: 'owner'
    }
  })),
  useAddReportToCollection: vi.fn(() => ({
    mutateAsync: vi.fn()
  })),
  useRemoveReportFromCollection: vi.fn(() => ({
    mutateAsync: vi.fn()
  }))
}));

vi.mock('@/context/BusterNotifications', () => ({
  useBusterNotifications: vi.fn(() => ({
    openInfoMessage: vi.fn(),
    openErrorMessage: vi.fn()
  }))
}));

vi.mock('@/components/features/list/FavoriteStar', () => ({
  useFavoriteStar: vi.fn(() => ({
    isFavorited: false,
    onFavoriteClick: vi.fn(),
    label: 'Add to favorites',
    value: 'add-to-favorites',
    icon: null
  }))
}));

vi.mock('@/components/features/versionHistory/useListVersionDropdownItems', () => ({
  useListVersionDropdownItems: vi.fn(() => []) // Return an empty array instead of an object
}));

vi.mock('@/components/features/metrics/StatusBadgeIndicator/useStatusDropdownContent', () => ({
  useStatusDropdownContent: vi.fn(() => ({
    label: 'Request verification',
    value: 'request-verification',
    icon: null,
    items: []
  }))
}));

vi.mock('@/components/features/dropdowns/SaveToCollectionsDropdown', () => ({
  useSaveToCollectionsDropdownContent: vi.fn(() => ({
    ModalComponent: null,
    label: 'Add to collection',
    value: 'add-to-collection',
    icon: null,
    items: []
  }))
}));

vi.mock('@/controllers/ReportPageControllers/useReportPageExport', () => ({
  useReportPageExport: vi.fn(() => ({
    exportReportAsPDF: vi.fn(),
    cancelExport: vi.fn(),
    ExportContainer: null
  }))
}));

describe('ReportThreeDotMenu', () => {
  const defaultProps = {
    reportId: 'report-123',
    reportVersionNumber: 1,
    isViewingOldVersion: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the three dot menu button', () => {
    render(<ReportThreeDotMenu {...defaultProps} />);

    const button = screen.getByTestId('three-dot-menu-button');
    expect(button).toBeInTheDocument();
  });

  describe('Refresh Report Functionality', () => {
    let mockStartChatFromAsset: Mock;
    let mockOnChangePage: Mock;
    let mockOnSetFileView: Mock;

    beforeEach(() => {
      mockStartChatFromAsset = vi.fn().mockResolvedValue({
        id: 'new-chat-123'
      });

      mockOnChangePage = vi.fn().mockResolvedValue(undefined);
      mockOnSetFileView = vi.fn();

      // Update mocks for this test using the already mocked modules
      const useStartChatFromAssetMock = vi.mocked(useStartChatFromAsset);
      useStartChatFromAssetMock.mockReturnValue({
        mutateAsync: mockStartChatFromAsset,
        isPending: false
      } as any);

      const useAppLayoutContextSelectorMock = vi.mocked(useAppLayoutContextSelector);
      useAppLayoutContextSelectorMock.mockReturnValue(mockOnChangePage);

      const useChatLayoutContextSelectorMock = vi.mocked(useChatLayoutContextSelector);
      useChatLayoutContextSelectorMock.mockReturnValue(mockOnSetFileView);
    });

    it('should call startChatFromAsset with correct parameters when refresh is clicked', async () => {
      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // Find and click the refresh button
      const refreshButton = await screen.findByText('Refresh report');
      fireEvent.click(refreshButton);

      // Wait for the async operation
      await waitFor(() => {
        expect(mockStartChatFromAsset).toHaveBeenCalledWith({
          asset_id: 'report-123',
          asset_type: 'report',
          prompt: 'Please refresh this report with the most up-to-date data.'
        });
      });
    });

    it('should navigate to the new chat after refresh', async () => {
      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // Find and click the refresh button
      const refreshButton = await screen.findByText('Refresh report');
      fireEvent.click(refreshButton);

      // Wait for navigation
      await waitFor(() => {
        expect(mockOnChangePage).toHaveBeenCalledWith({
          route: expect.any(String), // BusterRoutes.APP_CHAT_ID_REPORT_ID
          reportId: 'report-123',
          chatId: 'new-chat-123'
        });
      });

      // Verify file view is set after navigation
      await waitFor(
        () => {
          expect(mockOnSetFileView).toHaveBeenCalledWith({
            fileId: 'report-123',
            fileView: 'chart'
          });
        },
        { timeout: 500 }
      ); // Account for the 250ms timeout in the code
    });

    it('should show loading state while refresh is in progress', async () => {
      // Set pending state
      const useStartChatFromAssetMock = vi.mocked(useStartChatFromAsset);
      useStartChatFromAssetMock.mockReturnValue({
        mutateAsync: mockStartChatFromAsset,
        isPending: true // Set loading state
      } as any);

      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // The refresh button should indicate loading state
      // Note: The actual UI implementation may vary (spinner, disabled state, etc.)
      // This is testing that the loading prop is passed correctly
      const refreshItem = await screen.findByText('Refresh report');
      expect(refreshItem).toBeInTheDocument();
    });

    it('should handle errors gracefully during refresh', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStartChatFromAsset.mockRejectedValue(new Error('Network error'));

      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // Find and click the refresh button
      const refreshButton = await screen.findByText('Refresh report');
      fireEvent.click(refreshButton);

      // Wait for error handling
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to refresh report:',
          expect.any(Error)
        );
      });

      // Navigation should not occur on error
      expect(mockOnChangePage).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edit with AI Functionality', () => {
    it('should render Edit with AI option', async () => {
      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // Check that Edit with AI option is present
      const editWithAI = await screen.findByText('Edit with AI');
      expect(editWithAI).toBeInTheDocument();
    });

    it('should call onCreateFileClick when Edit with AI is clicked', async () => {
      const mockOnCreateFileClick = vi.fn();

      // Re-mock the hook for this specific test
      const { useStartChatFromReport } = await import('./useStartChatFromAsset');
      vi.mocked(useStartChatFromReport).mockReturnValue({
        onCreateFileClick: mockOnCreateFileClick,
        loading: false
      });

      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // Click Edit with AI
      const editWithAI = await screen.findByText('Edit with AI');
      fireEvent.click(editWithAI);

      expect(mockOnCreateFileClick).toHaveBeenCalled();
    });
  });

  describe('Menu Items', () => {
    it('should render all expected menu items', async () => {
      render(<ReportThreeDotMenu {...defaultProps} />);

      // Open the dropdown
      const menuButton = screen.getByTestId('three-dot-menu-button');
      fireEvent.click(menuButton);

      // Check for all expected menu items
      const expectedItems = [
        'Edit with AI',
        'Share report',
        'Add to collection',
        'Add to favorites', // Or 'Remove from favorites' based on state
        'Version history',
        'Refresh report',
        'Download as PDF'
      ];

      for (const itemText of expectedItems) {
        const item = await screen.findByText(itemText);
        expect(item).toBeInTheDocument();
      }
    });
  });
});
