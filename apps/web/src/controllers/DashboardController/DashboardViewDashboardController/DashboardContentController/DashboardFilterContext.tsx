import React, { createContext, useContext, useState } from 'react';

interface DashboardFilterContextValue {
  dashboardFilterValues: Record<string, unknown>;
  setDashboardFilterValues: (values: Record<string, unknown>) => void;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | undefined>(undefined);

export const DashboardFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dashboardFilterValues, setDashboardFilterValues] = useState<Record<string, unknown>>({});

  return (
    <DashboardFilterContext.Provider value={{ dashboardFilterValues, setDashboardFilterValues }}>
      {children}
    </DashboardFilterContext.Provider>
  );
};

export const useDashboardFilterValues = () => {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    return { dashboardFilterValues: {}, setDashboardFilterValues: () => {} };
  }
  return context;
};
