import { describe, it, expect, vi } from 'vitest';
import { createReportRoute, type ReportRouteParams } from './createReportRoute';
import { BusterRoutes } from '@/routes/busterRoutes';

// Mock the createBusterRoute function
vi.mock('@/routes/busterRoutes', async () => {
  const actual = await vi.importActual('@/routes/busterRoutes');
  return {
    ...actual
  };
});

describe('createReportRoute', () => {
  describe('standalone report routes (no chatId)', () => {
    it('should create basic report route when page is undefined', () => {
      // Test case: Basic report route without page parameter
      // Expected output: Standard report route
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-123'
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-123');
    });

    it('should create basic report route when page is "report"', () => {
      // Test case: Explicit report page
      // Expected output: Standard report route
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-456',
        page: 'report'
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-456');
    });

    it('should create file route when page is "file"', () => {
      // Test case: File page without version number
      // Expected output: File route without query parameter when undefined
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-789',
        page: 'file'
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-789/file');
    });

    it('should create file route with version number when page is "files"', () => {
      // Test case: File page with specific version number
      // Expected output: File route with version number parameter
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-101',
        page: 'file',
        reportVersionNumber: 5
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-101/file?report_version_number=5');
    });

    it('should handle reportVersionNumber on report page (should be ignored)', () => {
      // Test case: Version number provided but page is report
      // Expected output: Standard report route (version number ignored)
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-202',
        page: 'report',
        reportVersionNumber: 3
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-202');
    });
  });

  describe('chat context report routes (with chatId)', () => {
    it('should create chat report route when page is undefined', () => {
      // Test case: Chat context report without page parameter
      // Expected output: Chat report route
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-chat-1',
        chatId: 'chat-123'
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/chats/chat-123/reports/report-chat-1');
    });

    it('should create chat report route when page is "report"', () => {
      // Test case: Explicit report page in chat context
      // Expected output: Chat report route
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-chat-2',
        chatId: 'chat-456',
        page: 'report'
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/chats/chat-456/reports/report-chat-2');
    });

    it('should create chat file route when page is "files"', () => {
      // Test case: File page in chat context without version
      // Expected output: Chat file route with undefined version
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-chat-3',
        chatId: 'chat-789',
        page: 'file'
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/chats/chat-789/reports/report-chat-3/file');
    });

    it('should create chat file route with version number when page is "files"', () => {
      // Test case: File page in chat context with version number
      // Expected output: Chat file route with version parameter
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-chat-4',
        chatId: 'chat-101',
        page: 'file',
        reportVersionNumber: 7
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/chats/chat-101/reports/report-chat-4/file?report_version_number=7');
    });

    it('should handle reportVersionNumber on chat report page (should be ignored)', () => {
      // Test case: Version number in chat context on report page
      // Expected output: Chat report route (version number ignored)
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-chat-5',
        chatId: 'chat-202',
        page: 'report',
        reportVersionNumber: 4
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/chats/chat-202/reports/report-chat-5');
    });
  });

  describe('edge cases and validation', () => {
    it('should handle empty asset ID', () => {
      // Test case: Empty asset ID
      // Expected output: Route with empty reportId
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: ''
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/');
    });

    it('should handle empty chat ID when provided', () => {
      // Test case: Empty chat ID
      // Expected output: Chat route with empty chatId
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-test',
        chatId: ''
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-test');
    });

    it('should handle reportVersionNumber of 0', () => {
      // Test case: Version number is 0 (valid but falsy)
      // Expected output: File route with version 0
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-version-zero',
        page: 'file',
        reportVersionNumber: 0
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-version-zero/file');
    });

    it('should handle negative reportVersionNumber', () => {
      // Test case: Negative version number
      // Expected output: File route with negative version
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-negative',
        page: 'file',
        reportVersionNumber: -1
      };

      const result = createReportRoute(params);

      expect(result).toBe('/app/reports/report-negative/file?report_version_number=-1');
    });
  });

  describe('page type validation', () => {
    it('should default to "report" page when page is undefined', () => {
      // Test case: No page parameter provided
      // Expected output: Should default to report behavior
      const params: Omit<ReportRouteParams, 'type'> = {
        assetId: 'report-default'
      };

      const result = createReportRoute(params);

      // Should create standard report route, not file route
      expect(result).toBe('/app/reports/report-default');
      expect(result).not.toContain('/file');
    });

    it('should handle all valid page types', () => {
      // Test case: Test all valid page types
      // Expected output: Correct routes for each page type
      const baseParams = { assetId: 'report-page-test' };

      const reportResult = createReportRoute({ ...baseParams, page: 'report' });
      const filesResult = createReportRoute({ ...baseParams, page: 'file' });
      const undefinedResult = createReportRoute({ ...baseParams, page: undefined });

      expect(reportResult).toBe('/app/reports/report-page-test');
      expect(filesResult).toBe('/app/reports/report-page-test/file');
      expect(undefinedResult).toBe('/app/reports/report-page-test');
    });
  });
});
