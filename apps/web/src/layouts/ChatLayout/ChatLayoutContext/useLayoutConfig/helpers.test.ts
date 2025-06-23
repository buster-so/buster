import { describe, expect, it } from 'vitest';
import { BusterRoutes } from '@/routes';
import { initializeFileViews } from './helpers';
import type { FileViewSecondary } from './interfaces';

describe('initializeFileViews', () => {
  it('should return empty object when no metricId or dashboardId is provided', () => {
    const result = initializeFileViews({
      metricId: undefined,
      dashboardId: undefined,
      currentRoute: BusterRoutes.APP_HOME,
      secondaryView: undefined
    });

    expect(result).toEqual({});
  });

  it('should initialize metric view with chart as default when route does not map to a view', () => {
    const metricId = 'metric123';
    const result = initializeFileViews({
      metricId,
      dashboardId: undefined,
      currentRoute: BusterRoutes.APP_HOME,
      secondaryView: undefined
    });

    expect(result).toEqual({
      [metricId]: {
        selectedFileView: 'chart',
        fileViewConfig: {
          chart: {
            secondaryView: undefined
          }
        }
      }
    });
  });

  it('should initialize metric view with specific view from route', () => {
    const metricId = 'metric123';
    const result = initializeFileViews({
      metricId,
      dashboardId: undefined,
      currentRoute: BusterRoutes.APP_METRIC_ID_RESULTS,
      secondaryView: undefined
    });

    expect(result).toEqual({
      [metricId]: {
        selectedFileView: 'results',
        fileViewConfig: {
          results: {
            secondaryView: undefined
          }
        }
      }
    });
  });

  it('should initialize dashboard view with dashboard as default when route does not map to a view', () => {
    const dashboardId = 'dashboard123';
    const result = initializeFileViews({
      metricId: undefined,
      dashboardId,
      currentRoute: BusterRoutes.APP_HOME,
      secondaryView: undefined
    });

    expect(result).toEqual({
      [dashboardId]: {
        selectedFileView: 'dashboard',
        fileViewConfig: {
          dashboard: {
            secondaryView: undefined
          }
        }
      }
    });
  });

  it('should initialize dashboard view with specific view from route', () => {
    const dashboardId = 'dashboard123';
    const result = initializeFileViews({
      metricId: undefined,
      dashboardId,
      currentRoute: BusterRoutes.APP_DASHBOARD_ID_FILE,
      secondaryView: undefined
    });

    expect(result).toEqual({
      [dashboardId]: {
        selectedFileView: 'file',
        fileViewConfig: {
          file: {
            secondaryView: undefined
          }
        }
      }
    });
  });

  it('should include secondaryView in metric config when provided', () => {
    const metricId = 'metric123';
    const secondaryView: FileViewSecondary = 'chart-edit';
    const result = initializeFileViews({
      metricId,
      dashboardId: undefined,
      currentRoute: BusterRoutes.APP_METRIC_ID_CHART,
      secondaryView
    });

    expect(result).toEqual({
      [metricId]: {
        selectedFileView: 'chart',
        fileViewConfig: {
          chart: {
            secondaryView: 'chart-edit'
          }
        }
      }
    });
  });

  it('should include secondaryView in dashboard config when provided', () => {
    const dashboardId = 'dashboard123';
    const secondaryView: FileViewSecondary = 'version-history';
    const result = initializeFileViews({
      metricId: undefined,
      dashboardId,
      currentRoute: BusterRoutes.APP_DASHBOARD_ID,
      secondaryView
    });

    expect(result).toEqual({
      [dashboardId]: {
        selectedFileView: 'dashboard',
        fileViewConfig: {
          dashboard: {
            secondaryView: 'version-history'
          }
        }
      }
    });
  });
});
