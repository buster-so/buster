interface Axis {
  x: string[];
  y: string[];
  y2: string[];
  size: string[];
  tooltips: string[];
}

type DataPoint = Record<string, string | number>;

interface Dataset {
  label: { key: string; value: string }[][];
  data: (number | null)[];
  dataKey: string | null;
  tooltipData: { value: string; key: string }[][];
}

interface CreateDatasetsFromAggregatesReturn {
  datasets: Dataset[];
}

export function prepareChartData(
  axis: Axis,
  data: DataPoint[]
): CreateDatasetsFromAggregatesReturn {
  const xKeys = axis.x;
  const uniqueXCombinations: Record<string, string>[] = [];
  const groupMap = new Map<
    string,
    { xCombination: Record<string, string>; dataPoints: DataPoint[] }
  >();

  // Group data by unique x-axis combinations
  for (const dataPoint of data) {
    const xCombination: Record<string, string> = {};
    for (const key of xKeys) {
      const value = dataPoint[key];
      if (typeof value !== 'string' && typeof value !== 'number') {
        throw new Error(
          `Data point has invalid type for key "${key}": expected string or number, got ${typeof value}`
        );
      }
      xCombination[key] = value.toString();
    }
    const stringKey = JSON.stringify(xCombination);
    if (!groupMap.has(stringKey)) {
      groupMap.set(stringKey, { xCombination, dataPoints: [] });
      uniqueXCombinations.push(xCombination);
    }
    groupMap.get(stringKey)!.dataPoints.push(dataPoint);
  }

  const datasets: Dataset[] = [];
  const allDataKeys = [...axis.y, ...axis.y2];

  // Create a dataset for each y or y2 key
  for (const dataKey of allDataKeys) {
    const dataset: Dataset = {
      label: uniqueXCombinations.map((xComb) => xKeys.map((key) => ({ key, value: xComb[key] }))),
      data: uniqueXCombinations.map((xComb) => {
        const stringKey = JSON.stringify(xComb);
        const group = groupMap.get(stringKey)!;
        const sum = group.dataPoints.reduce((acc, dp) => {
          const value = dp[dataKey];
          if (typeof value === 'number') {
            return acc + value;
          } else if (typeof value === 'string') {
            const numValue = parseFloat(value);
            return isNaN(numValue) ? acc : acc + numValue;
          }
          return acc;
        }, 0);
        return sum;
      }),
      dataKey,
      tooltipData: uniqueXCombinations.map((xComb) => {
        const stringKey = JSON.stringify(xComb);
        const group = groupMap.get(stringKey)!;
        const firstDp = group.dataPoints[0];
        const sum = group.dataPoints.reduce((acc, dp) => {
          const value = dp[dataKey];
          if (typeof value === 'number') {
            return acc + value;
          } else if (typeof value === 'string') {
            const numValue = parseFloat(value);
            return isNaN(numValue) ? acc : acc + numValue;
          }
          return acc;
        }, 0);
        const xTooltip = xKeys.map((key) => ({
          key,
          value: xComb[key]
        }));
        const yTooltip = { key: dataKey, value: sum.toString() };
        const otherTooltips = axis.tooltips.map((key) => ({
          key,
          value: (firstDp[key] ?? '').toString()
        }));
        return [...xTooltip, yTooltip, ...otherTooltips];
      })
    };
    datasets.push(dataset);
  }

  return { datasets };
}
