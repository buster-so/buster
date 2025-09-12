import { Store, useStore } from '@tanstack/react-store';
import { setupChartJS } from './ChartJSTheme';

export const chartJsContextStore = new Store({
  hasSetupChartJS: false,
  shouldSetupChartJS: true,
});

export const useChartJsContext = () => {
  return useStore(chartJsContextStore);
};

export const useSetupChartJS = () => {
  const { hasSetupChartJS, shouldSetupChartJS } = useChartJsContext();

  if (shouldSetupChartJS) {
    setupChartJS().then(() => {
      chartJsContextStore.setState(() => ({
        hasSetupChartJS: true,
        shouldSetupChartJS: false,
      }));
    });
    chartJsContextStore.setState((prev) => ({
      ...prev,
      shouldSetupChartJS: false,
    }));
  }

  return hasSetupChartJS;
};
