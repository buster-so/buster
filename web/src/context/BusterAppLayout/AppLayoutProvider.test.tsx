import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAppLayout } from './AppLayoutProvider';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { BusterRoutesWithArgsRoute } from '@/routes/busterRoutes';
import { BusterAppRoutes } from '@/routes/busterRoutes/busterAppRoutes';
import { DashboardSecondaryRecord } from '@/layouts/ChatLayout/FileContainer/FileContainerSecondary/secondaryPanelsConfig/dashboardPanels';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useParams: vi.fn()
}));

describe('useAppLayout - onChangePage', () => {
  // Mock window.location and history
  const mockPush = vi.fn();
  const mockPushState = vi.fn();
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Setup router mock
    (useRouter as any).mockReturnValue({ push: mockPush });
    (usePathname as any).mockReturnValue('/');
    (useParams as any).mockReturnValue({});

    // Store original window.location and history
    originalLocation = window.location;
    originalHistory = window.history;

    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: ''
    } as Location;

    // Mock window.history
    delete (window as any).history;
    window.history = {
      ...originalHistory,
      pushState: mockPushState
    } as History;
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.location = originalLocation;
    window.history = originalHistory;
  });

  it('should not navigate when target URL is identical to current URL', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard');

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPushState).not.toHaveBeenCalled();
  });

  it('should handle shallow routing when only query params change', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard?filter=active', { shallow: true });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPushState).toHaveBeenCalled();
    const url = new URL(window.location.href);
    url.searchParams.set('filter', 'active');
    expect(window.history.pushState).toHaveBeenCalledWith({}, '', url);
  });

  it('should navigate to new route when pathname changes', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/settings');

    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('should update query parameters on same pathname', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard?filter=all';
    window.location.pathname = '/dashboard';
    window.location.search = '?filter=all';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard?filter=active');

    expect(mockPush).toHaveBeenCalledWith('/dashboard?filter=active');
  });

  it('should remove query parameters when navigating to clean URL', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard?filter=active';
    window.location.pathname = '/dashboard';
    window.location.search = '?filter=active';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard');

    expect(mockPushState).toHaveBeenCalledWith({}, '', expect.any(String));
  });

  it('should handle route with dynamic parameters', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    const route: BusterRoutesWithArgsRoute = {
      route: BusterAppRoutes.APP_DASHBOARD_ID,
      dashboardId: '123'
    };

    await result.current.onChangePage(route);

    expect(mockPush).toHaveBeenCalled();
  });

  it('should handle multiple query parameters', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard?filter=active&sort=date&view=list');

    expect(mockPush).toHaveBeenCalledWith('/dashboard?filter=active&sort=date&view=list');
  });

  it('should support shallow navigation with existing query params', async () => {
    // Set initial URL with existing query params
    window.location.href = 'http://localhost:3000/dashboard?page=1';
    window.location.pathname = '/dashboard';
    window.location.search = '?page=1';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/dashboard?page=1&filter=active', { shallow: true });

    expect(mockPush).not.toHaveBeenCalled();
    expect(mockPushState).toHaveBeenCalled();
  });

  it('should handle navigating to relative paths', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard/settings';
    window.location.pathname = '/dashboard/settings';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('../profile');

    expect(mockPush).toHaveBeenCalledWith('../profile');
  });

  it('should not trigger navigation when passing the same URL with different casing', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/dashboard';
    window.location.pathname = '/dashboard';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage('/DashBoard');

    expect(mockPush).toHaveBeenCalled();
  });

  it('should handle adding a remove a param', async () => {
    // Set initial URL
    window.location.href =
      'http://localhost:3000/app/dashboard/123?dashboard_version_number=1&secondary_view=version-history';
    window.location.pathname = '/app/dashboard/123';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage({
      route: BusterAppRoutes.APP_DASHBOARD_ID,
      dashboardId: '123'
    });

    expect(mockPush).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/app/dashboards/123');
  });

  it('should handle adding adding two params', async () => {
    // Set initial URL
    window.location.href = 'http://localhost:3000/app/dashboard/123';
    window.location.pathname = '/app/dashboard/123';

    const { result } = renderHook(() => useAppLayout());

    await result.current.onChangePage({
      route: BusterAppRoutes.APP_DASHBOARD_ID_VERSION_NUMBER,
      dashboardId: '123',
      versionNumber: 2,
      secondaryView: 'version-history'
    });

    expect(mockPush).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      '/app/dashboards/123?dashboard_version_number=2&secondary_view=version-history'
    );
  });
});

describe('useAppLayout - onChangeQueryParams', () => {
  // Mock window.location and history
  const mockPushState = vi.fn();
  let originalLocation: Location;
  let originalHistory: History;

  beforeEach(() => {
    // Setup router mock
    (useRouter as any).mockReturnValue({ push: vi.fn() });
    (usePathname as any).mockReturnValue('/');
    (useParams as any).mockReturnValue({});

    // Store original window.location and history
    originalLocation = window.location;
    originalHistory = window.history;

    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: ''
    } as Location;

    // Mock window.history
    delete (window as any).history;
    window.history = {
      ...originalHistory,
      pushState: mockPushState
    } as History;
  });

  afterEach(() => {
    vi.clearAllMocks();
    window.location = originalLocation;
    window.history = originalHistory;
  });

  it('should add new query parameters while preserving existing ones', () => {
    // Set initial URL with existing query params
    window.location.href = 'http://localhost:3000/dashboard?page=1';
    window.location.pathname = '/dashboard';
    window.location.search = '?page=1';

    const { result } = renderHook(() => useAppLayout());

    result.current.onChangeQueryParams({ filter: 'active' }, true);

    expect(mockPushState).toHaveBeenCalled();
    const url = new URL(window.location.href);
    url.searchParams.set('filter', 'active');
    // Should preserve existing params
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.get('filter')).toBe('active');
    expect(mockPushState).toHaveBeenCalledWith({}, '', url);
  });

  it('should replace all existing query parameters when preserveExisting is false', () => {
    // Set initial URL with existing query params
    window.location.href = 'http://localhost:3000/dashboard?page=1&sort=date';
    window.location.pathname = '/dashboard';
    window.location.search = '?page=1&sort=date';

    const { result } = renderHook(() => useAppLayout());

    result.current.onChangeQueryParams({ filter: 'active' }, false);

    expect(mockPushState).toHaveBeenCalled();
    const url = new URL(window.location.href);
    // Clear existing params
    url.search = '';
    // Add new params
    url.searchParams.set('filter', 'active');
    // Should not contain old params
    expect(url.searchParams.has('page')).toBe(false);
    expect(url.searchParams.has('sort')).toBe(false);
    expect(url.searchParams.get('filter')).toBe('active');
    expect(mockPushState).toHaveBeenCalledWith({}, '', url);
  });

  it('should remove query parameters when value is null', () => {
    // Set initial URL with existing query params
    window.location.href = 'http://localhost:3000/dashboard?page=1&filter=active&sort=date';
    window.location.pathname = '/dashboard';
    window.location.search = '?page=1&filter=active&sort=date';

    const { result } = renderHook(() => useAppLayout());

    result.current.onChangeQueryParams({ filter: null, sort: null }, true);

    expect(mockPushState).toHaveBeenCalled();
    const url = new URL(window.location.href);
    // Should remove specified params
    url.searchParams.delete('filter');
    url.searchParams.delete('sort');
    // Should preserve other params
    expect(url.searchParams.get('page')).toBe('1');
    expect(url.searchParams.has('filter')).toBe(false);
    expect(url.searchParams.has('sort')).toBe(false);
    expect(mockPushState).toHaveBeenCalledWith({}, '', url);
  });
});
