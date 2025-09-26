import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useNewChatWarning } from './useNewChatWarning';

// Mock the API hooks
vi.mock('@/api/buster_rest/data_source', () => ({
  useListDatasources: vi.fn(),
}));

vi.mock('@/api/buster_rest/datasets', () => ({
  useGetDatasets: vi.fn(),
}));

vi.mock('@/api/buster_rest/users/useGetUserInfo', () => ({
  useIsUserAdmin: vi.fn(),
  useGetUserRole: vi.fn(),
}));

import { useListDatasources } from '@/api/buster_rest/data_source';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { useGetUserRole, useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';

const mockUseListDatasources = vi.mocked(useListDatasources);
const mockUseGetDatasets = vi.mocked(useGetDatasets);
const mockUseIsUserAdmin = vi.mocked(useIsUserAdmin);
const mockUseGetUserRole = vi.mocked(useGetUserRole);

describe('useNewChatWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show warning when datasets are empty and data is fetched', () => {
    mockUseGetDatasets.mockReturnValue({
      data: [],
      isFetched: true,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: [{ id: '1', name: 'Test Datasource' }],
      isFetched: true,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(true);
    mockUseGetUserRole.mockReturnValue('workspace_admin');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(true);
    expect(result.current.hasDatasets).toBe(false);
    expect(result.current.hasDatasources).toBe(true);
    expect(result.current.isFetched).toBe(true);
  });

  it('should show warning when datasources are empty and data is fetched', () => {
    mockUseGetDatasets.mockReturnValue({
      data: [{ id: '1', name: 'Test Dataset' }],
      isFetched: true,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: [],
      isFetched: true,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(false);
    mockUseGetUserRole.mockReturnValue('querier');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(true);
    expect(result.current.hasDatasets).toBe(true);
    expect(result.current.hasDatasources).toBe(false);
    expect(result.current.isFetched).toBe(true);
  });

  it('should show warning when both datasets and datasources are empty', () => {
    mockUseGetDatasets.mockReturnValue({
      data: [],
      isFetched: true,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: [],
      isFetched: true,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(true);
    mockUseGetUserRole.mockReturnValue('workspace_admin');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(true);
    expect(result.current.hasDatasets).toBe(false);
    expect(result.current.hasDatasources).toBe(false);
    expect(result.current.isFetched).toBe(true);
  });

  it('should not show warning when both datasets and datasources have data', () => {
    mockUseGetDatasets.mockReturnValue({
      data: [{ id: '1', name: 'Test Dataset' }],
      isFetched: true,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: [{ id: '1', name: 'Test Datasource' }],
      isFetched: true,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(false);
    mockUseGetUserRole.mockReturnValue('viewer');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(false);
    expect(result.current.hasDatasets).toBe(true);
    expect(result.current.hasDatasources).toBe(true);
    expect(result.current.isFetched).toBe(true);
  });

  it('should not show warning when datasets are not yet fetched', () => {
    mockUseGetDatasets.mockReturnValue({
      data: undefined,
      isFetched: false,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: [],
      isFetched: true,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(true);
    mockUseGetUserRole.mockReturnValue('workspace_admin');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(false);
    expect(result.current.isFetched).toBe(false);
  });

  it('should not show warning when datasources are not yet fetched', () => {
    mockUseGetDatasets.mockReturnValue({
      data: [],
      isFetched: true,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: undefined,
      isFetched: false,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(false);
    mockUseGetUserRole.mockReturnValue('querier');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(false);
    expect(result.current.isFetched).toBe(false);
  });

  it('should not show warning when neither datasets nor datasources are fetched', () => {
    mockUseGetDatasets.mockReturnValue({
      data: undefined,
      isFetched: false,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: undefined,
      isFetched: false,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(true);
    mockUseGetUserRole.mockReturnValue('workspace_admin');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.showWarning).toBe(false);
    expect(result.current.isFetched).toBe(false);
  });

  it('should correctly return admin status and user role', () => {
    mockUseGetDatasets.mockReturnValue({
      data: [{ id: '1', name: 'Test Dataset' }],
      isFetched: true,
    } as any);
    mockUseListDatasources.mockReturnValue({
      data: [{ id: '1', name: 'Test Datasource' }],
      isFetched: true,
    } as any);
    mockUseIsUserAdmin.mockReturnValue(true);
    mockUseGetUserRole.mockReturnValue('data_admin');

    const { result } = renderHook(() => useNewChatWarning());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.userRole).toBe('data_admin');
    expect(result.current.showWarning).toBe(false);
  });
});
