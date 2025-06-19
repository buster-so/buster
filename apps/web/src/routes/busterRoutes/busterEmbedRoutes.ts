export enum BusterEmbedRoutes {
  EMBED_METRIC_ID = '/embed/metrics/:metricId',
  EMBED_DASHBOARD_ID = '/embed/dashboards/:dashboardId'
}

export type BusterEmbedRoutesWithArgs = {
  [BusterEmbedRoutes.EMBED_METRIC_ID]: {
    route: BusterEmbedRoutes.EMBED_METRIC_ID;
    metricId: string;
  };
  [BusterEmbedRoutes.EMBED_DASHBOARD_ID]: {
    route: BusterEmbedRoutes.EMBED_DASHBOARD_ID;
    dashboardId: string;
  };
};
