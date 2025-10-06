import React, { createContext, useContext, useState } from 'react';

interface DashboardFilterContextValue {
  dashboardFilterValues: Record<string, unknown>;
  setDashboardFilterValues: (values: Record<string, unknown>) => void;
  showMetricFilters: boolean;
  setShowMetricFilters: (show: boolean) => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | undefined>(undefined);

export const DashboardFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardFilterValues, setDashboardFilterValues] = useState<Record<string, unknown>>({});
  const [showMetricFilters, setShowMetricFilters] = useState<boolean>(false);

  return (
    <DashboardFilterContext.Provider
      value={{
        dashboardFilterValues,
        setDashboardFilterValues,
        showMetricFilters,
        setShowMetricFilters
      }}
    >
      {children}
    </DashboardFilterContext.Provider>
  );
};

export const useDashboardFilterValues = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    return {
      dashboardFilterValues: {},
      setDashboardFilterValues: () => {},
      showMetricFilters: true, // Default to true when not on dashboard
      setShowMetricFilters: () => {},
      isOnDashboard: false
    };
  }
  return { ...context, isOnDashboard: true };
};
