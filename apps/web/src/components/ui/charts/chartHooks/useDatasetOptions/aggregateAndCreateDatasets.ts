import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import type { DatasetOption, DatasetOptionsWithTicks, KV } from './interfaces';

type ColumnLabelFormatBase = Pick<Partial<ColumnLabelFormat>, 'replaceMissingDataWith'>;

export function aggregateAndCreateDatasets<
  T extends Record<string, string | number | null | Date | undefined>,
>(
  data: T[],
  axis: {
    x: (keyof T)[];
    y: (keyof T)[];
    y2?: (keyof T)[];
    size?: [string] | string[] | undefined;
    tooltip?: (keyof T)[] | null;
    category?: (keyof T)[];
  },
  columnLabelFormats: Record<string, ColumnLabelFormatBase | undefined>,
  isScatterPlot = false,
  colorConfig?: {
    field: string;
    mapping: Map<string, string>;
  }
): DatasetOptionsWithTicks {
  // Normalize axis keys to strings
  const xKeys = axis.x.map(String);
  const yKeys = axis.y.map(String);
  const y2Keys = axis.y2?.map(String) ?? [];
  const sizeKey = axis.size?.[0] ? String(axis.size[0]) : null;
  const tooltipKeys = axis.tooltip?.map(String) ?? [];
  const catKeys = axis.category?.map(String) ?? [];

  // Prepare column formats with defaults
  const allKeys = new Set<string>([
    ...yKeys,
    ...y2Keys,
    ...(sizeKey ? [sizeKey] : []),
    ...tooltipKeys,
  ]);
  const colFormats: Record<string, ColumnLabelFormatBase> = {};
  for (const k of allKeys) {
    colFormats[k] = columnLabelFormats[k] || {};
  }

  // Parse numeric values with replaceMissingDataWith
  function parseNumeric(
    raw: string | number | null | undefined | Date | boolean,
    fmt: ColumnLabelFormatBase | undefined
  ): number | null {
    const rep = fmt?.replaceMissingDataWith === null ? null : (fmt?.replaceMissingDataWith ?? 0);
    const n = Number(raw);
    if (raw == null || raw === '' || Number.isNaN(n)) {
      if (rep === null) return null;
      if (typeof rep === 'string' && Number.isNaN(Number(rep))) return Number.NaN;
      return Number(rep);
    }
    return n;
  }

  // Format tooltip values, treating missing as empty or replacement
  function formatTooltip(
    raw: string | number | null | undefined | Date | boolean,
    fmt: ColumnLabelFormatBase | undefined
  ): string | number | boolean {
    if (raw == null || raw === '') {
      if (fmt?.replaceMissingDataWith !== undefined) {
        const rep = fmt.replaceMissingDataWith;
        return rep === null ? '' : rep;
      }
      return '';
    }
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'object') return raw.toString();
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  }

  // Utility to group rows by a set of keys
  function groupRows(
    keys: string[],
    rows: T[]
  ): Array<{ id: string; rec: Record<string, string>; rows: T[] }> {
    const map = new Map<string, { rec: Record<string, string>; rows: T[] }>();
    for (const row of rows) {
      const rec: Record<string, string> = {};
      for (const k of keys) {
        rec[k] = String((row as Record<string, string | number | null | undefined>)[k]);
      }
      const id = keys.map((k) => rec[k]).join('|');
      if (!map.has(id)) {
        map.set(id, { rec, rows: [] });
      }
      map.get(id)?.rows.push(row);
    }
    return Array.from(map.entries()).map(([id, g]) => ({ id, rec: g.rec, rows: g.rows }));
  }

  // Helper function to generate labels based on the rules
  function generateLabels(metric: string, catRec?: Record<string, string>): KV[] {
    const labels: KV[] = [];

    // If there are multiple y-axes (y and y2), include the metric
    if (yKeys.length + y2Keys.length > 1) {
      labels.push({ key: metric, value: '' });
    }

    // If there are categories, add them
    if (catRec && catKeys.length > 0) {
      for (const catKey of catKeys) {
        labels.push({ key: catKey, value: catRec[catKey] ?? '' });
      }
    } else if (yKeys.length + y2Keys.length === 1) {
      // If no categories and only one y-axis, use the metric key
      labels.push({ key: metric, value: '' });
    }

    return labels;
  }

  // If colorBy is specified, split data by color values first
  if (colorConfig && !isScatterPlot) {
    return createDatasetsByColorThenAggregate(
      data,
      axis,
      columnLabelFormats,
      colorConfig,
      xKeys,
      yKeys,
      y2Keys,
      catKeys,
      tooltipKeys,
      colFormats,
      parseNumeric,
      formatTooltip,
      generateLabels,
      groupRows,
      createDatasetId
    );
  }

  // Precompute grouping by categories and by x-axis combos
  const catGroups = catKeys.length ? groupRows(catKeys, data) : [{ id: '', rec: {}, rows: data }];
  const xGroups = groupRows(xKeys, data);

  // Series metadata for non-scatter
  const seriesMeta = [
    ...yKeys.map((k) => ({ key: k, axisType: 'y' as const })),
    ...y2Keys.map((k) => ({ key: k, axisType: 'y2' as const })),
  ];

  const datasets: DatasetOption[] = [];

  if (isScatterPlot) {
    // SCATTER: for each category group and each yKey
    const scatterTicksKey: KV[] = xKeys.map((key) => ({ key, value: '' }));

    for (const { rec: catRec, rows } of catGroups) {
      for (const yKey of yKeys) {
        const fmtY = colFormats[yKey];
        const axisType = 'y';

        // Filter out rows with null or undefined x values to ensure data-tick alignment
        const validRows = rows.filter((row) => xKeys.every((xKey) => row[xKey] != null));

        const dataArr = validRows.map((r) => parseNumeric(r[yKey], fmtY));
        let sizeArr: (number | null)[] | undefined;
        if (sizeKey) {
          const fmtSize = colFormats[sizeKey];
          sizeArr = validRows.map((r) => parseNumeric(r[sizeKey], fmtSize));
        }

        // Generate labels for scatter plot
        const labelArr = generateLabels(yKey, catRec);

        const tooltipArr = validRows.map((r) => {
          const pts: KV[] = [];
          if (tooltipKeys.length) {
            for (const k of tooltipKeys) {
              const tooltip: KV = {
                key: k,
                value: formatTooltip(r[k], colFormats[k] || {}),
              };

              // Add categoryKey and categoryValue for category keys if categories exist
              if (catKeys.length > 0 && catKeys.includes(k)) {
                tooltip.categoryValue = String(catRec[k]);
                tooltip.categoryKey = k;
              }

              pts.push(tooltip);
            }
          } else {
            for (const k of xKeys) {
              const tooltip: KV = {
                key: k,
                value: formatTooltip(r[k], colFormats[k] || {}),
              };

              // Add categoryKey and categoryValue for category keys if categories exist
              if (catKeys.length > 0 && catKeys.includes(k)) {
                tooltip.categoryValue = String(catRec[k]);
                tooltip.categoryKey = k;
              }

              pts.push(tooltip);
            }

            pts.push({ key: yKey, value: formatTooltip(r[yKey], fmtY) });

            if (sizeArr && sizeKey) {
              pts.push({
                key: sizeKey,
                value: formatTooltip(r[sizeKey], colFormats[sizeKey] || {}),
              });
            }
          }
          return pts;
        });

        // Generate ticks for this dataset
        const ticksForScatter = validRows.map((row) =>
          xKeys.map((key) => row[key] as string | number)
        );

        // Generate ID for scatter plot dataset
        const id = createDatasetId(
          yKey,
          catKeys.length ? { keys: catKeys, record: catRec } : undefined
        );

        datasets.push({
          id,
          label: labelArr,
          data: dataArr,
          dataKey: yKey,
          axisType,
          tooltipData: tooltipArr,
          ticksForScatter,
          ...(sizeArr && { sizeData: sizeArr, sizeDataKey: sizeKey ?? '' }),
        });
      }
    }

    return {
      datasets,
      ticksKey: scatterTicksKey,
      ticks: [], // Empty ticks for scatter plots
    };
  }
  // NON-SCATTER
  if (catKeys.length) {
    // With categories
    for (const { key: metric, axisType } of seriesMeta) {
      const fmt = colFormats[metric];
      for (const { rec: catRec, rows: catRows } of catGroups) {
        const xSub = groupRows(xKeys, catRows);
        const xMap = new Map(xSub.map((g) => [g.id, g.rows]));

        const dataArr = xGroups.map((g) => {
          const grp = xMap.get(g.id) || [];
          let sum = 0;
          let sawNull = false;
          for (const r of grp) {
            const v = parseNumeric(r[metric], fmt);
            if (v === null) sawNull = true;
            else if (!Number.isNaN(v)) sum += v;
          }
          return sawNull ? null : sum;
        });

        // Generate labels according to the rules
        const labelArr = generateLabels(metric, catRec);

        // For tooltip, use specified tooltip fields or default to metric value
        const tooltipArr = tooltipKeys.length
          ? xGroups.map(({ rows }) => {
              const row = rows[0] || ({} as T);
              // For y2 axis, only include its own metric key
              if (axisType === 'y2') {
                const rowMetric = row[metric] as string | number | null | undefined;
                return [
                  {
                    key: metric,
                    value: formatTooltip(rowMetric, colFormats[metric] || {}),
                  },
                ];
              }
              // For y axis metrics, exclude y2-axis metrics from tooltips
              const uniqueTooltipKeys = tooltipKeys.filter((k) => !y2Keys.includes(k));
              return uniqueTooltipKeys.map((k) => {
                const tooltip: KV = {
                  key: k,
                  value: formatTooltip(row[k], colFormats[k] || {}),
                };

                // Add categoryKey and categoryValue for category keys if categories exist
                if (catKeys.includes(k)) {
                  tooltip.categoryValue = String(catRec[k]);
                  tooltip.categoryKey = k;
                }

                return tooltip;
              });
            })
          : dataArr.map((value) => {
              const tooltip: KV = {
                key: metric,
                value: value === null ? '' : value,
              };

              // Add category info if this is a metrics tooltip
              if (catKeys.length > 0) {
                // We only add the first category as categoryValue to match the interface
                const firstCatKey = catKeys[0];
                tooltip.categoryValue = String(catRec[firstCatKey || '']);
                tooltip.categoryKey = firstCatKey || '';
              }

              return [tooltip];
            });

        // Generate ID for category dataset
        const id = createDatasetId(metric, { keys: catKeys, record: catRec });

        datasets.push({
          id,
          label: labelArr,
          data: dataArr,
          dataKey: metric,
          axisType,
          tooltipData: tooltipArr,
        });
      }
    }
  } else {
    // Without categories
    for (const { key: metric, axisType } of seriesMeta) {
      const fmt = colFormats[metric];

      // Create a single dataset with all x-group data
      const dataArr: (number | null)[] = [];

      // Collect all values for the dataset
      for (const { rows: grpRows } of xGroups) {
        let sum = 0;
        let sawNull = false;
        for (const r of grpRows) {
          const v = parseNumeric(r[metric], fmt);
          if (v === null) sawNull = true;
          else if (!Number.isNaN(v)) sum += v;
        }
        const value = sawNull ? null : sum;
        dataArr.push(value);
      }

      // Generate labels according to the rules
      const labelArr = generateLabels(metric);

      // For tooltip, use specified tooltip fields or default to metric value
      const tooltipArr = tooltipKeys.length
        ? xGroups.map(({ rows }) => {
            const row = rows[0] || ({} as T);
            // For y2 axis, only include its own metric key
            if (axisType === 'y2') {
              const rowMetric = row[metric] as string | number | null | undefined;
              return [
                {
                  key: metric,
                  value: formatTooltip(rowMetric, colFormats[metric] || {}),
                },
              ];
            }
            // For y axis metrics, exclude y2-axis metrics from tooltips
            const uniqueTooltipKeys = tooltipKeys.filter((k) => !y2Keys.includes(k));
            return uniqueTooltipKeys.map((k) => ({
              key: k,
              value: formatTooltip(row[k], colFormats[k] || {}),
            }));
          })
        : dataArr.map((value) => [
            {
              key: metric,
              value: value === null ? '' : value,
            },
          ]);

      // Generate ID for the dataset
      const id = createDatasetId(metric);

      datasets.push({
        id,
        label: labelArr,
        data: dataArr,
        dataKey: metric,
        axisType,
        tooltipData: tooltipArr,
      });
    }
  }

  // Create ticks from the x-axis values
  const ticksKey: KV[] = xKeys.map((key) => ({
    key,
    value: '',
  }));

  // Extract ticks from xGroups
  const ticks: (string | number)[][] = xGroups.map((group) => {
    return xKeys.map((key) => {
      const value = group.rec[key];
      return value ?? '';
    });
  });

  return {
    datasets,
    ticksKey,
    ticks,
  };
}

/**
 * Creates datasets by splitting data by color values first, then aggregating each subset
 * This preserves the granular color information needed for proper aggregation
 */
export function createDatasetsByColorThenAggregate<
  T extends Record<string, string | number | null | Date | undefined>,
>(
  data: T[],
  axis: {
    x: (keyof T)[];
    y: (keyof T)[];
    y2?: (keyof T)[];
    size?: [string] | string[] | undefined;
    tooltip?: (keyof T)[] | null;
    category?: (keyof T)[];
  },
  columnLabelFormats: Record<string, ColumnLabelFormatBase | undefined>,
  colorConfig: { field: string; mapping: Map<string, string> },
  xKeys: string[],
  yKeys: string[],
  y2Keys: string[],
  catKeys: string[],
  tooltipKeys: string[],
  colFormats: Record<string, ColumnLabelFormatBase>,
  parseNumeric: (
    raw: string | number | null | undefined | Date | boolean,
    fmt: ColumnLabelFormatBase | undefined
  ) => number | null,
  formatTooltip: (
    raw: string | number | null | undefined | Date | boolean,
    fmt: ColumnLabelFormatBase | undefined
  ) => string | number | boolean,
  _generateLabels: (metric: string, catRec?: Record<string, string>) => KV[],
  groupRows: (
    keys: string[],
    rows: T[]
  ) => Array<{ id: string; rec: Record<string, string>; rows: T[] }>,
  createDatasetId: (
    measureKey: string,
    categoryInfo?: { keys: string[]; record: Record<string, string> }
  ) => string
): DatasetOptionsWithTicks {
  const { field: colorByField, mapping: colorMapping } = colorConfig;

  // Get unique color values that have valid colors mapped
  const uniqueColorValues = Array.from(
    new Set(
      data
        .map((row) => row[colorByField])
        .filter((val) => val !== null && val !== undefined)
        .map(String)
    )
  ).filter((colorValue) => colorMapping.has(colorValue));

  if (uniqueColorValues.length === 0) {
    // No valid color values, fall back to regular aggregation without colors
    return aggregateAndCreateDatasets(data, axis, columnLabelFormats, false, undefined);
  }

  // Split data by color values
  const dataByColor = new Map<string, T[]>();
  for (const colorValue of uniqueColorValues) {
    dataByColor.set(colorValue, []);
  }

  // Distribute data rows to their respective color buckets
  for (const row of data) {
    const colorValue = row[colorByField];
    if (colorValue !== null && colorValue !== undefined) {
      const colorValueStr = String(colorValue);
      if (dataByColor.has(colorValueStr)) {
        dataByColor.get(colorValueStr)?.push(row);
      }
    }
  }

  // Create x-axis groups from the original data for consistent tick structure
  const allXGroups = groupRows(xKeys, data);
  const ticksKey: KV[] = xKeys.map((key) => ({ key, value: '' }));
  const ticks: (string | number)[][] = allXGroups.map((group) => {
    return xKeys.map((key) => {
      const value = group.rec[key];
      return value ?? '';
    });
  });

  // Series metadata for non-scatter
  const seriesMeta = [
    ...yKeys.map((k) => ({ key: k, axisType: 'y' as const })),
    ...y2Keys.map((k) => ({ key: k, axisType: 'y2' as const })),
  ];

  const allDatasets: DatasetOption[] = [];

  // For each color value, create datasets
  for (let colorIndex = 0; colorIndex < uniqueColorValues.length; colorIndex++) {
    const colorValue = uniqueColorValues[colorIndex];
    const colorData = dataByColor.get(colorValue) || [];
    const color = colorMapping.get(colorValue);
    if (!color) continue; // Skip if no color mapping found

    // If no data for this color, create null datasets
    if (colorData.length === 0) {
      for (const { key: metric, axisType } of seriesMeta) {
        const id = `${metric}${colorIndex + 1}`;
        // Generate labels like the regular flow, but include color
        const label: KV[] = [];

        // If there are multiple y-axes (y and y2), include the metric
        if (yKeys.length + y2Keys.length > 1) {
          label.push({ key: metric, value: '' });
        }

        // Always include the color value
        label.push({ key: colorByField, value: colorValue });
        const nullData = new Array(allXGroups.length).fill(null);
        const nullTooltipData = new Array(allXGroups.length).fill([]);

        allDatasets.push({
          id,
          label,
          data: nullData,
          dataKey: metric,
          axisType,
          tooltipData: nullTooltipData,
          colors: color,
        });
      }
      continue;
    }

    // Aggregate this color's data
    const colorXGroups = groupRows(xKeys, colorData);
    const colorCatGroups = catKeys.length
      ? groupRows(catKeys, colorData)
      : [{ id: '', rec: {}, rows: colorData }];

    // Create mapping for quick lookup
    const colorXGroupMap = new Map(colorXGroups.map((g) => [g.id, g.rows]));

    if (catKeys.length) {
      // With categories
      for (const { key: metric, axisType } of seriesMeta) {
        const fmt = colFormats[metric];
        for (const { rec: catRec } of colorCatGroups) {
          const colorCatData =
            groupRows(catKeys, colorData).find((g) => catKeys.every((k) => g.rec[k] === catRec[k]))
              ?.rows || [];

          const colorCatXGroups = groupRows(xKeys, colorCatData);
          const colorCatXMap = new Map(colorCatXGroups.map((g) => [g.id, g.rows]));

          const dataArr = allXGroups.map((g) => {
            const grp = colorCatXMap.get(g.id) || [];
            if (grp.length === 0) return null; // No data for this color+x-axis combination
            let sum = 0;
            let sawNull = false;
            for (const r of grp) {
              const v = parseNumeric(r[metric], fmt);
              if (v === null) sawNull = true;
              else if (!Number.isNaN(v)) sum += v;
            }
            return sawNull ? null : sum;
          });

          // Generate labels like the regular flow, but include color
          const labelArr: KV[] = [];

          // If there are multiple y-axes (y and y2), include the metric
          if (yKeys.length + y2Keys.length > 1) {
            labelArr.push({ key: metric, value: '' });
          }

          // Always include the color value
          labelArr.push({ key: colorByField, value: colorValue });

          // If there are categories, add them
          if (catKeys.length > 0) {
            for (const catKey of catKeys) {
              labelArr.push({ key: catKey, value: catRec[catKey] ?? '' });
            }
          } else if (yKeys.length + y2Keys.length === 1) {
            // If no categories and only one y-axis, we already have the color, so we're good
            // (the metric key would be redundant)
          }

          const tooltipArr = tooltipKeys.length
            ? allXGroups.map(({ id }) => {
                const rows = colorCatXMap.get(id) || [];
                const row = rows[0] || ({} as T);
                if (axisType === 'y2') {
                  const rowMetric = row[metric] as string | number | null | undefined;
                  return [
                    { key: metric, value: formatTooltip(rowMetric, colFormats[metric] || {}) },
                  ];
                }
                const uniqueTooltipKeys = tooltipKeys.filter((k) => !y2Keys.includes(k));
                return uniqueTooltipKeys.map((k) => {
                  const tooltip: KV = {
                    key: k,
                    value: formatTooltip(row[k], colFormats[k] || {}),
                  };
                  if (catKeys.includes(k)) {
                    tooltip.categoryValue = String(catRec[k]);
                    tooltip.categoryKey = k;
                  }
                  return tooltip;
                });
              })
            : dataArr.map((value) => {
                const tooltip: KV = {
                  key: metric,
                  value: value === null ? '' : value,
                };
                if (catKeys.length > 0) {
                  const firstCatKey = catKeys[0];
                  tooltip.categoryValue = String(catRec[firstCatKey || '']);
                  tooltip.categoryKey = firstCatKey || '';
                }
                return [tooltip];
              });

          const id = `${createDatasetId(metric, { keys: catKeys, record: catRec })}${colorIndex + 1}`;

          allDatasets.push({
            id,
            label: labelArr,
            data: dataArr,
            dataKey: metric,
            axisType,
            tooltipData: tooltipArr,
            colors: color,
          });
        }
      }
    } else {
      // Without categories
      for (const { key: metric, axisType } of seriesMeta) {
        const fmt = colFormats[metric];

        const dataArr: (number | null)[] = allXGroups.map((group) => {
          const colorRows = colorXGroupMap.get(group.id) || [];
          if (colorRows.length === 0) return null; // No data for this color+x-axis combination
          let sum = 0;
          let sawNull = false;
          for (const r of colorRows) {
            const v = parseNumeric(r[metric], fmt);
            if (v === null) sawNull = true;
            else if (!Number.isNaN(v)) sum += v;
          }
          return sawNull ? null : sum;
        });

        // Generate labels like the regular flow, but include color
        const labelArr: KV[] = [];

        // If there are multiple y-axes (y and y2), include the metric
        if (yKeys.length + y2Keys.length > 1) {
          labelArr.push({ key: metric, value: '' });
        }

        // Always include the color value
        labelArr.push({ key: colorByField, value: colorValue });

        // If no categories and only one y-axis, we already have the color, so we're good
        // (the metric key would be redundant in single-axis case)

        const tooltipArr = tooltipKeys.length
          ? allXGroups.map(({ id }) => {
              const rows = colorXGroupMap.get(id) || [];
              const row = rows[0] || ({} as T);
              if (axisType === 'y2') {
                const rowMetric = row[metric] as string | number | null | undefined;
                return [{ key: metric, value: formatTooltip(rowMetric, colFormats[metric] || {}) }];
              }
              const uniqueTooltipKeys = tooltipKeys.filter((k) => !y2Keys.includes(k));
              return uniqueTooltipKeys.map((k) => ({
                key: k,
                value: formatTooltip(row[k], colFormats[k] || {}),
              }));
            })
          : dataArr.map((value) => [{ key: metric, value: value === null ? '' : value }]);

        const id = `${createDatasetId(metric)}${colorIndex + 1}`;

        allDatasets.push({
          id,
          label: labelArr,
          data: dataArr,
          dataKey: metric,
          axisType,
          tooltipData: tooltipArr,
          colors: color,
        });
      }
    }
  }

  return {
    datasets: allDatasets,
    ticksKey,
    ticks,
  };
}

/**
 * Creates a consistent dataset ID by combining the measure field with category or x-axis information
 */
function createDatasetId(
  measureKey: string,
  categoryInfo?: { keys: string[]; record: Record<string, string> },
  xAxisInfo?: { keys: string[]; record: Record<string, string> }
): string {
  if (categoryInfo && categoryInfo.keys.length > 0) {
    const catPart = categoryInfo.keys.map((k) => `${k}:${categoryInfo.record[k]}`).join('_');
    return `${measureKey}_${catPart}`;
  }

  if (xAxisInfo) {
    const xPart = xAxisInfo.keys.map((k) => `${k}:${xAxisInfo.record[k]}`).join('_');
    return `${measureKey}_${xPart}`;
  }

  return measureKey;
}
