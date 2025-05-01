import { renderHook } from '@testing-library/react';
import { useGetFileLink } from './useGetFileLink';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { assetParamsToRoute } from '@/lib/assets';

// Mock dependencies
jest.mock('@/layouts/ChatLayout', () => ({
  useChatLayoutContextSelector: jest.fn()
}));

jest.mock('@/lib/assets', () => ({
  assetParamsToRoute: jest.fn()
}));

describe('useGetFileLink', () => {
  const mockMetricVersionNumber = 5;
  const mockDashboardVersionNumber = 10;
  const mockMetricId = 'metric-123';
  const mockDashboardId = 'dashboard-456';
  const mockMessageId = 'message-789';
  const mockChatId = 'chat-123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useChatLayoutContextSelector to return our test values
    (useChatLayoutContextSelector as jest.Mock).mockImplementation((selector) => {
      const contextValues = {
        metricVersionNumber: mockMetricVersionNumber,
        dashboardVersionNumber: mockDashboardVersionNumber,
        metricId: mockMetricId,
        dashboardId: mockDashboardId,
        messageId: mockMessageId
      };
      return selector(contextValues);
    });

    // Mock assetParamsToRoute to return predictable values for testing
    (assetParamsToRoute as jest.Mock).mockImplementation(
      ({ assetId, type, versionNumber, secondaryView }) => {
        if (type === 'metric') {
          return `/metrics/${assetId}${versionNumber ? `/v${versionNumber}` : ''}${secondaryView ? `/${secondaryView}` : ''}`;
        } else if (type === 'dashboard') {
          return `/dashboards/${assetId}${versionNumber ? `/v${versionNumber}` : ''}${secondaryView ? `/${secondaryView}` : ''}`;
        } else if (type === 'reasoning') {
          return `/reasoning/${assetId}`;
        }
        return '';
      }
    );
  });

  describe('getFileLink', () => {
    it('should generate correct file link for metric', () => {
      const { result } = renderHook(() => useGetFileLink());

      const link = result.current.getFileLink({
        fileId: mockMetricId,
        fileType: 'metric',
        chatId: mockChatId,
        versionNumber: 3
      });

      expect(assetParamsToRoute).toHaveBeenCalledWith({
        chatId: mockChatId,
        assetId: mockMetricId,
        type: 'metric',
        versionNumber: 3,
        secondaryView: undefined
      });
      expect(link).toBe(`/metrics/${mockMetricId}/v3`);
    });

    it('should generate correct file link for dashboard', () => {
      const { result } = renderHook(() => useGetFileLink());

      const link = result.current.getFileLink({
        fileId: mockDashboardId,
        fileType: 'dashboard',
        versionNumber: 7
      });

      expect(assetParamsToRoute).toHaveBeenCalledWith({
        chatId: undefined,
        assetId: mockDashboardId,
        type: 'dashboard',
        versionNumber: 7,
        secondaryView: undefined
      });
      expect(link).toBe(`/dashboards/${mockDashboardId}/v7`);
    });

    it('should generate correct file link with version history mode', () => {
      const { result } = renderHook(() => useGetFileLink());

      const link = result.current.getFileLink({
        fileId: mockMetricId,
        fileType: 'metric',
        chatId: mockChatId,
        versionNumber: 3,
        useVersionHistoryMode: true
      });

      expect(assetParamsToRoute).toHaveBeenCalledWith({
        chatId: mockChatId,
        assetId: mockMetricId,
        type: 'metric',
        versionNumber: 3,
        secondaryView: 'version-history'
      });
      expect(link).toBe(`/metrics/${mockMetricId}/v3/version-history`);
    });
  });

  describe('getFileIsSelected', () => {
    it('should return true for selected metric with matching version number', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: mockMetricId,
        fileType: 'metric',
        versionNumber: mockMetricVersionNumber
      });

      expect(isSelected).toBe(true);
    });

    it('should return false for selected metric with non-matching version number', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: mockMetricId,
        fileType: 'metric',
        versionNumber: 999
      });

      expect(isSelected).toBe(false);
    });

    it('should return true for selected dashboard with matching version number', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: mockDashboardId,
        fileType: 'dashboard',
        versionNumber: mockDashboardVersionNumber
      });

      expect(isSelected).toBe(true);
    });

    it('should return false for selected dashboard with non-matching version number', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: 'different-dashboard',
        fileType: 'dashboard',
        versionNumber: mockDashboardVersionNumber
      });

      expect(isSelected).toBe(false);
    });

    it('should return true for selected reasoning file', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: mockMessageId,
        fileType: 'reasoning'
      });

      expect(isSelected).toBe(true);
    });

    it('should return false for non-matching reasoning file', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: 'different-message',
        fileType: 'reasoning'
      });

      expect(isSelected).toBe(false);
    });

    it('should return false for unsupported file type', () => {
      const { result } = renderHook(() => useGetFileLink());

      const isSelected = result.current.getFileIsSelected({
        fileId: 'some-id',
        fileType: 'dataset' as any
      });

      expect(isSelected).toBe(false);
    });
  });

  describe('getFileLinkMeta', () => {
    it('should return the correct meta information for a metric file', () => {
      const { result } = renderHook(() => useGetFileLink());

      const meta = result.current.getFileLinkMeta({
        fileId: mockMetricId,
        fileType: 'metric',
        chatId: mockChatId,
        versionNumber: mockMetricVersionNumber
      });

      expect(meta).toEqual({
        link: `/metrics/${mockMetricId}/v${mockMetricVersionNumber}`,
        isSelected: true,
        selectedVersionNumber: mockMetricVersionNumber
      });
    });

    it('should return the correct meta information for a dashboard file', () => {
      const mockDashboardVersionNumber = 10;
      const { result } = renderHook(() => useGetFileLink());

      const meta = result.current.getFileLinkMeta({
        fileId: mockDashboardId,
        fileType: 'dashboard',
        versionNumber: mockDashboardVersionNumber
      });
      console.log(meta);

      expect(meta).toEqual({
        link: `/dashboards/${mockDashboardId}/v${mockDashboardVersionNumber}`,
        isSelected: true,
        selectedVersionNumber: 5
      });
    });

    it('should return the correct meta information when file is not selected', () => {
      const { result } = renderHook(() => useGetFileLink());

      const meta = result.current.getFileLinkMeta({
        fileId: 'different-metric',
        fileType: 'metric',
        versionNumber: 999
      });

      expect(meta).toEqual({
        link: `/metrics/different-metric/v999`,
        isSelected: false,
        selectedVersionNumber: mockMetricVersionNumber
      });
    });
  });
});
