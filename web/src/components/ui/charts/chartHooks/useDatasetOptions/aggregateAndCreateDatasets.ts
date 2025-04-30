import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric';
import type { DatasetOption, DatasetOptionsWithTicks, KV } from './interfaces';

type ColumnLabelFormatBase = Pick<ColumnLabelFormat, 'replaceMissingDataWith'>;

export function aggregateAndCreateDatasets<
  T extends Record<string, string | number | null | Date | undefined>
>(
  data: T[],
  axis: {
    x: (keyof T)[];
    y: (keyof T)[];
    y2?: (keyof T)[];
    size?: [] | [string] | undefined;
    tooltip?: (keyof T)[] | null;
    category?: (keyof T)[];
  },
  columnLabelFormats: Record<string, ColumnLabelFormatBase | undefined>,
  isScatterPlot = false
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
    ...tooltipKeys
  ]);
  const colFormats: Record<string, ColumnLabelFormatBase> = {};
  allKeys.forEach((k) => {
    colFormats[k] = columnLabelFormats[k] || {};
  });

  // Parse numeric values with replaceMissingDataWith
  function parseNumeric(raw: any, fmt: ColumnLabelFormatBase): number | null {
    const rep = fmt.replaceMissingDataWith === null ? null : (fmt.replaceMissingDataWith ?? 0);
    const n = Number(raw);
    if (raw == null || raw === '' || Number.isNaN(n)) {
      if (rep === null) return null;
      if (typeof rep === 'string' && isNaN(Number(rep))) return NaN;
      return Number(rep);
    }
    return n;
  }

  // Format tooltip values, treating missing as empty or replacement
  function formatTooltip(raw: any, fmt: ColumnLabelFormatBase): string | number | boolean {
    if (raw == null || raw === '') {
      if (fmt.replaceMissingDataWith !== undefined) {
        const rep = fmt.replaceMissingDataWith;
        return rep === null ? '' : rep;
      }
      return '';
    }
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'object') return raw;
    const num = Number(raw);
    return Number.isNaN(num) ? raw : num;
  }

  // Utility to group rows by a set of keys
  function groupRows(
    keys: string[],
    rows: T[]
  ): Array<{ id: string; rec: Record<string, string>; rows: T[] }> {
    const map = new Map<string, { rec: Record<string, string>; rows: T[] }>();
    rows.forEach((row) => {
      const rec: Record<string, string> = {};
      keys.forEach((k) => {
        rec[k] = String((row as any)[k]);
      });
      const id = keys.map((k) => rec[k]).join('|');
      if (!map.has(id)) {
        map.set(id, { rec, rows: [] });
      }
      map.get(id)!.rows.push(row);
    });
    return Array.from(map.entries()).map(([id, g]) => ({ id, rec: g.rec, rows: g.rows }));
  }

  // Helper function to generate labels based on the rules
  function generateLabels(metric: string, catRec?: Record<string, string>, isY2 = false): KV[] {
    const labels: KV[] = [];

    // If there are multiple y-axes (y and y2), include the metric
    if (yKeys.length + y2Keys.length > 1) {
      labels.push({ key: metric, value: '' });
    }

    // If there are categories, add them
    if (catRec && catKeys.length > 0) {
      catKeys.forEach((catKey) => {
        labels.push({ key: catKey, value: catRec[catKey] });
      });
    } else if (yKeys.length + y2Keys.length === 1) {
      // If no categories and only one y-axis, use the metric key
      labels.push({ key: metric, value: '' });
    }

    return labels;
  }

  // Precompute grouping by categories and by x-axis combos
  const catGroups = catKeys.length ? groupRows(catKeys, data) : [{ id: '', rec: {}, rows: data }];
  const xGroups = groupRows(xKeys, data);

  // Series metadata for non-scatter
  const seriesMeta = [
    ...yKeys.map((k) => ({ key: k, axisType: 'y' as const })),
    ...y2Keys.map((k) => ({ key: k, axisType: 'y2' as const }))
  ];

  const datasets: DatasetOption[] = [];

  if (isScatterPlot) {
    // SCATTER: for each category group and each yKey
    catGroups.forEach(({ rec: catRec, rows }) => {
      yKeys.forEach((yKey) => {
        const fmtY = colFormats[yKey];
        const axisType = 'y';

        const dataArr = rows.map((r) => parseNumeric(r[yKey], fmtY));
        let sizeArr: (number | null)[] | undefined;
        if (sizeKey) {
          const fmtSize = colFormats[sizeKey];
          sizeArr = rows.map((r) => parseNumeric(r[sizeKey], fmtSize));
        }

        // Generate labels for scatter plot
        const labelArr = generateLabels(yKey, catRec);

        const tooltipArr = rows.map((r) => {
          const pts: KV[] = [];
          if (tooltipKeys.length) {
            tooltipKeys.forEach((k) =>
              pts.push({ key: k, value: formatTooltip(r[k], colFormats[k] || {}) })
            );
          } else {
            xKeys.forEach((k) =>
              pts.push({ key: k, value: formatTooltip(r[k], colFormats[k] || {}) })
            );
            pts.push({ key: yKey, value: formatTooltip(r[yKey], fmtY) });
            if (sizeArr) {
              pts.push({
                key: sizeKey!,
                value: formatTooltip(r[sizeKey!], colFormats[sizeKey!] || {})
              });
            }
          }
          return pts;
        });

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
          ...(sizeArr && { sizeData: sizeArr, sizeDataKey: sizeKey ?? undefined })
        });
      });
    });
  } else {
    // NON-SCATTER
    if (catKeys.length) {
      // With categories
      seriesMeta.forEach(({ key: metric, axisType }) => {
        const fmt = colFormats[metric];
        catGroups.forEach(({ rec: catRec, rows: catRows }) => {
          const xSub = groupRows(xKeys, catRows);
          const xMap = new Map(xSub.map((g) => [g.id, g.rows]));

          const dataArr = xGroups.map((g) => {
            const grp = xMap.get(g.id) || [];
            let sum = 0;
            let sawNull = false;
            grp.forEach((r) => {
              const v = parseNumeric(r[metric], fmt);
              if (v === null) sawNull = true;
              else if (!Number.isNaN(v)) sum += v;
            });
            return sawNull ? null : sum;
          });

          // Generate labels according to the rules
          const labelArr = generateLabels(metric, catRec, axisType === 'y2');

          // For tooltip, use specified tooltip fields or default to metric value
          const tooltipArr = tooltipKeys.length
            ? xGroups.map(({ rows }) => {
                const row = rows[0] || {};
                return tooltipKeys.map((k) => ({
                  key: k,
                  value: formatTooltip(row[k], colFormats[k] || {})
                }));
              })
            : dataArr.map((value) => [
                {
                  key: metric,
                  value: value === null ? '' : value
                }
              ]);

          // Generate ID for category dataset
          const id = createDatasetId(metric, { keys: catKeys, record: catRec });

          datasets.push({
            id,
            label: labelArr,
            data: dataArr,
            dataKey: metric,
            axisType,
            tooltipData: tooltipArr
          });
        });
      });
    } else {
      // Without categories
      seriesMeta.forEach(({ key: metric, axisType }) => {
        const fmt = colFormats[metric];

        // Create a single dataset with all x-group data
        const dataArr: (number | null)[] = [];

        // Collect all values for the dataset
        xGroups.forEach(({ rec, rows: grpRows }) => {
          let sum = 0;
          let sawNull = false;
          grpRows.forEach((r) => {
            const v = parseNumeric(r[metric], fmt);
            if (v === null) sawNull = true;
            else if (!Number.isNaN(v)) sum += v;
          });
          const value = sawNull ? null : sum;
          dataArr.push(value);
        });

        // Generate labels according to the rules
        const labelArr = generateLabels(metric);

        // For tooltip, use specified tooltip fields or default to metric value
        const tooltipArr = tooltipKeys.length
          ? xGroups.map(({ rows }) => {
              const row = rows[0] || {};
              return tooltipKeys.map((k) => ({
                key: k,
                value: formatTooltip(row[k], colFormats[k] || {})
              }));
            })
          : dataArr.map((value) => [
              {
                key: metric,
                value: value === null ? '' : value
              }
            ]);

        // Generate ID for the dataset
        const id = createDatasetId(metric);

        datasets.push({
          id,
          label: labelArr,
          data: dataArr,
          dataKey: metric,
          axisType,
          tooltipData: tooltipArr
        });
      });
    }
  }

  // Create ticks from the x-axis values
  const ticksKey: KV[] = xKeys.map((key) => ({
    key,
    value: ''
  }));

  // Extract ticks from xGroups
  const ticks: string[][] = xGroups.map((group) => {
    return xKeys.map((key) => {
      const value = group.rec[key];
      return String(value);
    });
  });

  return {
    datasets,
    ticksKey,
    ticks
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
