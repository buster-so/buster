import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, type MockedFunction, vi } from 'vitest';
import type { FileType } from '@/api/asset_interfaces/chat';
import type { AppSplitterRef } from '@/components/ui/layouts/AppSplitter';
import { BusterRoutes } from '@/routes';
import type { SelectedFile } from '../../interfaces';
import type { FileViewSecondary } from '../useLayoutConfig';
import { createSelectedFile } from './createSelectedFile';
import { useSelectedFile } from './useSelectedFile';

// Mock dependencies
vi.mock('./createSelectedFile');

// Mock the BusterAppLayout context
const mockOnChangePage = vi.fn();
vi.mock('@/context/BusterAppLayout', () => ({
  useAppLayoutContextSelector: vi.fn((selector) => mockOnChangePage)
}));

const mockCreateSelectedFile = createSelectedFile as MockedFunction<typeof createSelectedFile>;

describe('useSelectedFile', () => {
  const mockAnimateOpenSplitter = vi.fn();
  const mockAppSplitterRef = {
    current: {
      isSideClosed: vi.fn((side: 'left' | 'right') => false),
      setSplitSizes: vi.fn(),
      animateWidth: vi.fn(),
      sizes: [0, 0, 0]
    } as AppSplitterRef
  };
  const mockChatParams = {
    chatId: '123',
    isVersionHistoryMode: false,
    metricId: undefined,
    dashboardId: undefined,
    collectionId: undefined,
    datasetId: undefined,
    messageId: undefined,
    currentRoute: BusterRoutes.APP_CHAT_ID,
    secondaryView: undefined as FileViewSecondary | undefined,
    metricVersionNumber: undefined,
    dashboardVersionNumber: undefined
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null selected file when no chat params are provided', () => {
    mockCreateSelectedFile.mockReturnValue(null);

    const { result } = renderHook(() =>
      useSelectedFile({
        animateOpenSplitter: mockAnimateOpenSplitter,
        appSplitterRef: mockAppSplitterRef,
        chatParams: mockChatParams
      })
    );

    expect(result.current.selectedFile).toBeNull();
  });

  it('should initialize with selected file when valid chat params are provided', () => {
    const mockFile: SelectedFile = {
      id: '456',
      type: 'metric' as FileType,
      versionNumber: 1
    };
    mockCreateSelectedFile.mockReturnValue(mockFile);

    const { result } = renderHook(() =>
      useSelectedFile({
        animateOpenSplitter: mockAnimateOpenSplitter,
        appSplitterRef: mockAppSplitterRef,
        chatParams: {
          ...mockChatParams,
          metricId: '456',
          metricVersionNumber: 1
        }
      })
    );

    expect(result.current.selectedFile).toEqual(mockFile);
  });

  it('should handle setting a new selected file', async () => {
    mockCreateSelectedFile.mockReturnValue(null);
    const newFile: SelectedFile = {
      id: '789',
      type: 'metric' as FileType,
      versionNumber: 1
    };

    const { result } = renderHook(() =>
      useSelectedFile({
        animateOpenSplitter: mockAnimateOpenSplitter,
        appSplitterRef: mockAppSplitterRef,
        chatParams: mockChatParams
      })
    );

    await act(async () => {
      await result.current.onSetSelectedFile(newFile);
    });

    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('both');
    expect(mockOnChangePage).toHaveBeenCalledWith(
      '/app/chats/123/metrics/789/chart?metric_version_number=1'
    );
  });

  it('should collapse splitter when setting same file that is already open', async () => {
    const currentFile: SelectedFile = {
      id: '789',
      type: 'metric' as FileType,
      versionNumber: 1
    };
    mockCreateSelectedFile.mockReturnValue(currentFile);

    const { result } = renderHook(() =>
      useSelectedFile({
        animateOpenSplitter: mockAnimateOpenSplitter,
        appSplitterRef: mockAppSplitterRef,
        chatParams: {
          ...mockChatParams,
          metricId: '789',
          metricVersionNumber: 1
        }
      })
    );

    await act(async () => {
      await result.current.onSetSelectedFile(currentFile);
    });

    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('left');
  });

  it('should handle setting selected file to null', async () => {
    mockCreateSelectedFile.mockReturnValue(null);

    const { result } = renderHook(() =>
      useSelectedFile({
        animateOpenSplitter: mockAnimateOpenSplitter,
        appSplitterRef: mockAppSplitterRef,
        chatParams: mockChatParams
      })
    );

    await act(async () => {
      await result.current.onSetSelectedFile(null);
    });

    expect(mockAnimateOpenSplitter).toHaveBeenCalledWith('left');
  });
});
