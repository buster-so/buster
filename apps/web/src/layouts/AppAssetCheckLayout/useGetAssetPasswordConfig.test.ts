import { describe, expect, it } from 'vitest';
import type { ApiError } from '@/api/errors';
import { chatQueryKeys } from '@/api/query_keys/chat';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { metricsQueryKeys } from '@/api/query_keys/metric';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { getAssetAccess, getSelectedQuery } from './useGetAssetPasswordConfig';

describe('getAssetAccess', () => {
  it('should return password required state when error status is 418', () => {
    const error = { status: 418 } as ApiError;
    const result = getAssetAccess(error, true, ['test'], false);

    expect(result).toEqual({
      hasAccess: false,
      passwordRequired: true,
      isPublic: true,
      isDeleted: false,
      isFetched: true,
    });
  });

  it('should return deleted state when error status is 410', () => {
    const error = { status: 410 } as ApiError;
    const result = getAssetAccess(error, true, ['test'], false);

    expect(result).toEqual({
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      isDeleted: true,
      isFetched: true,
    });
  });

  it('should return no access state when error status is 403', () => {
    const error = { status: 403 } as ApiError;
    const result = getAssetAccess(error, true, ['test'], false);

    expect(result).toEqual({
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched: true,
    });
  });

  it('should return no access state when error has any other numeric status', () => {
    const error = { status: 500 } as ApiError;
    const result = getAssetAccess(error, true, ['test'], false);

    expect(result).toEqual({
      hasAccess: false,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched: true,
    });
  });

  it('should return has access state when no data and is fetched with no error', () => {
    const result = getAssetAccess(null, true, ['test'], false);

    expect(result).toEqual({
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched: true,
    });
  });

  it('should return has access state when no error and has data', () => {
    const result = getAssetAccess(null, true, ['test'], true);

    expect(result).toEqual({
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched: true,
    });
  });

  it('should return has access state when not fetched and no error', () => {
    const result = getAssetAccess(null, false, ['test'], false);

    expect(result).toEqual({
      hasAccess: true,
      passwordRequired: false,
      isPublic: false,
      isDeleted: false,
      isFetched: false,
    });
  });
});

describe('getSelectedQuery', () => {
  it('should return metric query for metric_file type', () => {
    const result = getSelectedQuery('metric_file', 'test-id', 'LATEST');
    const expected = metricsQueryKeys.metricsGetMetric('test-id', 'LATEST');

    expect(result).toEqual(expected);
  });

  it('should return dashboard query for dashboard_file type', () => {
    const result = getSelectedQuery('dashboard_file', 'test-id', 123);
    const expected = dashboardQueryKeys.dashboardGetDashboard('test-id', 123);

    expect(result).toEqual(expected);
  });

  it('should return report query for report_file type', () => {
    const result = getSelectedQuery('report_file', 'test-id', 'LATEST');
    const expected = reportsQueryKeys.reportsGetReport('test-id', 'LATEST');

    expect(result).toEqual(expected);
  });

  it('should return collection query for collection type', () => {
    const result = getSelectedQuery('collection', 'test-id', 'LATEST');
    const expected = collectionQueryKeys.collectionsGetCollection('test-id');

    expect(result).toEqual(expected);
  });

  it('should return chat query for reasoning type', () => {
    const result = getSelectedQuery('reasoning', 'test-id', 'LATEST');
    const expected = chatQueryKeys.chatsGetChat('test-id');

    expect(result).toEqual(expected);
  });

  it('should return chat query as default for chat type', () => {
    const result = getSelectedQuery('chat', 'test-id', 'LATEST');
    const expected = chatQueryKeys.chatsGetChat('test-id');

    expect(result).toEqual(expected);
  });
});
