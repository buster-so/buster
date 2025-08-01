import type React from 'react';
import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';

const ChartWrapperContext = createContext<{
  width: number;
}>({} as { width: number });

export const ChartWrapperProvider: React.FC<
  PropsWithChildren<{
    width: number;
  }>
> = ({ children, width }) => {
  return <ChartWrapperContext.Provider value={{ width }}>{children}</ChartWrapperContext.Provider>;
};

export const useChartWrapperContextSelector = <T,>(selector: (state: { width: number }) => T) => {
  const result = selector(useContext(ChartWrapperContext));
  return useMemo(() => result, [result]);
};

const ChartLegendWrapperContext = createContext<{
  inactiveDatasets: Record<string, boolean>;
}>({} as { inactiveDatasets: Record<string, boolean> });

export const ChartLegendWrapperProvider: React.FC<
  PropsWithChildren<{
    inactiveDatasets: Record<string, boolean>;
  }>
> = ({ children, inactiveDatasets }) => {
  return (
    <ChartLegendWrapperContext.Provider value={{ inactiveDatasets }}>
      {children}
    </ChartLegendWrapperContext.Provider>
  );
};

export const useChartLegendWrapperContextSelector = <T,>(
  selector: (state: { inactiveDatasets: Record<string, boolean> }) => T
) => {
  const result = selector(useContext(ChartLegendWrapperContext));
  return useMemo(() => result, [result]);
};
