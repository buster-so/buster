import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FileType } from '@/api/asset_interfaces/chat';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes';
import type { SelectedFile } from '../../interfaces';
import type { FileViewSecondary } from './interfaces';
import { useLayoutConfig } from './useLayoutConfig';

// Mock dependencies
vi.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    prefetch: vi.fn(),
    push: vi.fn()
  }))
}));

// Mock timeout to return immediately
vi.mock('@/lib/timeout', () => ({
  timeout: vi.fn().mockImplementation(() => Promise.resolve())
}));

describe('useLayoutConfig', () => {
  const mockOnChangePage = vi.fn();
  const mockAnimateOpenSplitter = vi.fn();
  const mockOnSetSelectedFile = vi.fn();
  const mockOnChangeQueryParams = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppLayoutContextSelector as any).mockImplementation((selector: any) => {
      const state = {
        onChangePage: mockOnChangePage,
        onChangeQueryParams: mockOnChangeQueryParams
      };
      return selector(state);
    });
  });

  const defaultProps: Parameters<typeof useLayoutConfig>[0] = {
    selectedFile: {
      id: 'metric-123',
      type: 'metric' as FileType,
      versionNumber: 1
    } as SelectedFile,
    isVersionHistoryMode: false,
    chatId: 'chat-123',
    onSetSelectedFile: mockOnSetSelectedFile,
    animateOpenSplitter: mockAnimateOpenSplitter,
    appSplitterRef: {
      current: {
        isSideClosed: vi.fn().mockReturnValue(false)
      }
    } as any,
    // ChatParams properties
    metricId: 'metric-123',
    dashboardId: undefined,
    collectionId: undefined,
    datasetId: undefined,
    messageId: undefined,
    metricVersionNumber: undefined,
    dashboardVersionNumber: undefined,
    currentRoute: BusterRoutes.APP_CHAT_ID,
    secondaryView: undefined,
    reportId: undefined,
    reportVersionNumber: undefined
  };

  it('should initialize with correct file views', () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    expect(result.current.selectedLayout).toBe('both');
    expect(result.current.selectedFileView).toBe('chart');
    expect(result.current.selectedFileViewSecondary).toBeNull();
    expect(result.current.selectedFileViewRenderSecondary).toBe(false);
  });

  it('should set file view correctly', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onSetFileView({ fileView: 'results' });
    });

    expect(result.current.selectedFileView).toBe('results');
    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('both');
  });

  it('should set secondary view correctly', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    expect(result.current.selectedFileView).toBe('chart');
    expect(result.current.selectedFileViewSecondary).toBe('chart-edit');
    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('right');
  });

  it('should close secondary view', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    // First set a secondary view
    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    // Then close it
    await act(async () => {
      await result.current.closeSecondaryView();
    });

    expect(result.current.selectedFileViewSecondary).toBeNull();
  });

  it('should collapse file and navigate to chat', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onCollapseFileClick();
    });

    expect(mockOnSetSelectedFile).toHaveBeenCalledWith(null);
    expect(mockOnChangePage).toHaveBeenCalledWith({
      route: BusterRoutes.APP_CHAT_ID,
      chatId: 'chat-123'
    });
  });

  it('should return correct layout based on props', () => {
    // With file and chat
    const { result: resultWithBoth } = renderHook(() => useLayoutConfig(defaultProps));
    expect(resultWithBoth.current.selectedLayout).toBe('both');

    // With chat only
    const { result: resultWithChat } = renderHook(() =>
      useLayoutConfig({
        ...defaultProps,
        selectedFile: null
      })
    );
    expect(resultWithChat.current.selectedLayout).toBe('chat-only');

    // With file only (no chat)
    const { result: resultWithFile } = renderHook(() =>
      useLayoutConfig({
        ...defaultProps,
        chatId: undefined
      })
    );
    expect(resultWithFile.current.selectedLayout).toBe('file-only');
  });

  it('should be chat hidden if secondary view is set', () => {
    const { result } = renderHook(() =>
      useLayoutConfig({
        ...defaultProps,
        metricId: 'metric-123',

        selectedFile: {
          id: 'metric-123',
          type: 'metric' as FileType,
          versionNumber: 1
        } as SelectedFile,
        secondaryView: 'chart-edit'
      })
    );
    expect(result.current.selectedLayout).toBe('chat-hidden');
  });

  it('should update fileViews when route-related props change', () => {
    const { rerender } = renderHook((props) => useLayoutConfig(props), {
      initialProps: defaultProps
    });

    // Update with a metric ID
    rerender({
      ...defaultProps,
      metricId: 'new-metric-id',
      currentRoute: BusterRoutes.APP_METRIC_ID_CHART
    });

    expect(mockAnimateOpenSplitter).toHaveBeenCalled();
  });

  it('should initialize with a dashboard file', () => {
    const dashboardProps = {
      ...defaultProps,
      selectedFile: {
        id: 'dashboard-123',
        type: 'dashboard' as FileType,
        versionNumber: 1
      } as SelectedFile
    };

    const { result } = renderHook(() => useLayoutConfig(dashboardProps));

    expect(result.current.selectedFileView).toBe('dashboard');
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    expect(result.current.selectedLayout).toBe('both');
    expect(result.current.selectedFileView).toBe('chart');
    expect(result.current.selectedFileViewSecondary).toBeNull();
  });

  it('should update selected layout when selectedFile is null', async () => {
    const { result, rerender } = renderHook(() => useLayoutConfig(defaultProps));

    // Rerender with selectedFile set to null
    rerender({
      ...defaultProps,
      selectedFile: null
    });

    expect(result.current.selectedLayout).toBe('both');
  });

  it('should update selected layout when selectedFile is null', async () => {
    const { result, rerender } = renderHook(() =>
      useLayoutConfig({ ...defaultProps, selectedFile: null })
    );

    // Rerender with selectedFile set to null
    rerender({
      ...defaultProps,
      selectedFile: null
    });

    expect(result.current.selectedLayout).toBe('chat-only');
  });

  it('should call onSetSelectedFile when collapsing file', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onCollapseFileClick();
    });

    expect(mockOnSetSelectedFile).toHaveBeenCalledWith(null);
  });

  it('should handle secondary view correctly when set', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    expect(result.current.selectedFileViewSecondary).toBe('chart-edit');
  });

  it('should reset secondary view when closeSecondaryView is called', async () => {
    const { result } = renderHook(() => useLayoutConfig(defaultProps));

    // Set a secondary view first
    await act(async () => {
      await result.current.onSetFileView({
        fileView: 'chart',
        secondaryView: 'chart-edit'
      });
    });

    // Now close the secondary view
    await act(async () => {
      await result.current.closeSecondaryView();
    });

    expect(result.current.selectedFileViewSecondary).toBeNull();
  });

  describe('useUpdateEffect', () => {
    it('should update file views when metricId changes', async () => {
      const { result, rerender } = renderHook((props) => useLayoutConfig(props), {
        initialProps: defaultProps
      });

      // Update with a new metric ID
      rerender({
        ...defaultProps,
        metricId: 'new-metric-id',
        currentRoute: BusterRoutes.APP_METRIC_ID_CHART
      });

      expect(result.current.selectedFileView).toBe('chart');
      expect(mockAnimateOpenSplitter).toHaveBeenCalled();
    });

    it('should update file views when secondaryView changes', async () => {
      const { result, rerender } = renderHook((props) => useLayoutConfig(props), {
        initialProps: defaultProps
      });

      expect(result.current.selectedFileViewSecondary).toBeNull();

      // Update with a new secondary view
      await act(async () => {
        rerender({
          ...defaultProps,
          secondaryView: 'chart-edit' as FileViewSecondary
        });
      });

      // Now the secondary view should be updated
      expect(result.current.selectedFileViewSecondary).toBe('chart-edit');
      expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('right');
    });

    it('should not update file views when changes are not significant', async () => {
      const { result, rerender } = renderHook((props) => useLayoutConfig(props), {
        initialProps: defaultProps
      });

      const initialCallCount = mockAnimateOpenSplitter.mock.calls.length;

      // Rerender with the same props
      rerender({ ...defaultProps });

      expect(mockAnimateOpenSplitter.mock.calls.length).toBe(initialCallCount);
    });

    it('should handle multiple dependency changes simultaneously', async () => {
      const { result, rerender } = renderHook((props) => useLayoutConfig(props), {
        initialProps: defaultProps
      });

      // Update multiple dependencies at once
      await act(async () => {
        rerender({
          ...defaultProps,
          metricId: 'metric-123',
          secondaryView: 'chart-edit' as FileViewSecondary
        });
      });

      // Now the secondary view should be updated
      expect(result.current.selectedFileViewSecondary).toBe('chart-edit');
      expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('right');
    });

    it('should handle transition from chat to file view correctly', async () => {
      const { result, rerender } = renderHook((props) => useLayoutConfig(props), {
        initialProps: {
          ...defaultProps,
          chatId: 'chat-123',
          selectedFile: null
        }
      });

      // Transition to file view
      rerender({
        ...defaultProps,
        metricId: 'new-metric-id',
        currentRoute: BusterRoutes.APP_METRIC_ID_CHART,
        selectedFile: {
          id: 'new-metric-id',
          type: 'metric',
          versionNumber: 1
        }
      } as any);

      expect(result.current.selectedLayout).toBe('both');
      expect(result.current.selectedFileView).toBe('chart');
      expect(mockAnimateOpenSplitter).toHaveBeenCalled();
    });
  });
});
