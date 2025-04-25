'use server';

import React from 'react';
import { AppAssetCheckLayout } from '../AppAssetCheckLayout';
import { DashboardLayoutContainer } from './DashboardLayoutContainer';

export const DashboardLayout: React.FC<{
  dashboardId: string;
  children: React.ReactNode;
}> = async ({ dashboardId, children }) => {
  return (
    <AppAssetCheckLayout assetId={dashboardId} type="dashboard">
      <DashboardLayoutContainer dashboardId={dashboardId}>{children}</DashboardLayoutContainer>
    </AppAssetCheckLayout>
  );
};
