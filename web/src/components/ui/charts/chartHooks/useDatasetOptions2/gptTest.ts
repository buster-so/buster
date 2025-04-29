type KV = { key: string; value: string | number | null };

type ColumnLabelFormatBase = {
  replaceMissingDataWith?: 0 | null | string;
};

type Dataset = {
  /** One array of KV pairs per data point (here always length 1 in non-scatter mode) */
  label: KV[][];
  data: (number | null)[];
  dataKey: string;
  axisType: 'y' | 'y2';
  /** One array of KV pairs per data point */
  tooltipData: KV[][];
  /** If you passed `axis.size`, one size value per data point */
  sizeData?: (number | null)[];
};

type CreateDatasetsFromAggregatesReturn = {
  datasets: Dataset[];
};

export function createDatasetsFromAggregates<T extends Record<string, any>>(
  data: T[],
  axis: {
    x: (keyof T)[];
    y: (keyof T)[];
    y2?: (keyof T)[];
    size?: (keyof T)[];
    tooltips?: (keyof T)[] | null;
    category?: (keyof T)[];
  },
  columnLabelFormats: Record<string, ColumnLabelFormatBase>,
  scatterPlot = false
): CreateDatasetsFromAggregatesReturn {
  // Normalize axis keys to strings
  const xKeys = axis.x.map(String);
  const yKeys = axis.y.map(String);
  const y2Keys = axis.y2?.map(String) ?? [];
  const sizeKey = axis.size?.[0] ? String(axis.size[0]) : null;
  const tooltipKeys = axis.tooltips?.map(String) ?? [];
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
  function formatTooltip(raw: any, fmt: ColumnLabelFormatBase): string | number {
    if (raw == null || raw === '') {
      if (fmt.replaceMissingDataWith !== undefined) {
        const rep = fmt.replaceMissingDataWith;
        return rep === null ? '' : rep;
      }
      return '';
    }
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

  // Precompute grouping by categories and by x-axis combos
  const catGroups = catKeys.length ? groupRows(catKeys, data) : [{ id: '', rec: {}, rows: data }];
  const xGroups = groupRows(xKeys, data);

  // Series metadata for non-scatter
  const seriesMeta = [
    ...yKeys.map((k) => ({ key: k, axisType: 'y' as const })),
    ...y2Keys.map((k) => ({ key: k, axisType: 'y2' as const }))
  ];

  const datasets: Dataset[] = [];

  if (scatterPlot) {
    // SCATTER: for each category group and each yKey
    catGroups.forEach(({ rows }) => {
      yKeys.forEach((yKey) => {
        const fmtY = colFormats[yKey];
        const axisType = 'y';

        const dataArr = rows.map((r) => parseNumeric(r[yKey], fmtY));
        let sizeArr: (number | null)[] | undefined;
        if (sizeKey) {
          const fmtSize = colFormats[sizeKey];
          sizeArr = rows.map((r) => parseNumeric(r[sizeKey], fmtSize));
        }

        const labelArr = rows.map((r) => xKeys.map((k) => ({ key: k, value: r[k] }) as KV));
        const tooltipArr = rows.map((r, i) => {
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

        datasets.push({
          label: labelArr,
          data: dataArr,
          dataKey: yKey,
          axisType,
          tooltipData: tooltipArr,
          ...(sizeArr && { sizeData: sizeArr })
        });
      });
    });
  } else {
    // NON-SCATTER
    if (catKeys.length) {
      // With categories
      seriesMeta.forEach(({ key: metric, axisType }) => {
        const fmt = colFormats[metric];
        catGroups.forEach(({ rows: catRows }) => {
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

          const labelArr = xGroups.map((g) =>
            xKeys.map((k) => ({ key: k, value: g.rec[k] }) as KV)
          );
          const tooltipArr = dataArr.map((val, i) => {
            const pts: KV[] = [];
            if (tooltipKeys.length) {
              const matchRow = (xMap.get(xGroups[i].id) || [])[0] || {};
              tooltipKeys.forEach((k) =>
                pts.push({
                  key: k,
                  value: formatTooltip((matchRow as any)[k], colFormats[k] || {})
                })
              );
            } else {
              pts.push({ key: metric, value: val === null ? '' : val });
            }
            return pts;
          });

          datasets.push({
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
        xGroups.forEach(({ rec, rows: grpRows }) => {
          let sum = 0;
          let sawNull = false;
          grpRows.forEach((r) => {
            const v = parseNumeric(r[metric], fmt);
            if (v === null) sawNull = true;
            else if (!Number.isNaN(v)) sum += v;
          });
          const value = sawNull ? null : sum;

          const labelArr = [xKeys.map((k) => ({ key: k, value: rec[k] }) as KV)];
          const tooltipArr = [
            [
              ...(tooltipKeys.length
                ? tooltipKeys.map((k) => ({
                    key: k,
                    value: formatTooltip((grpRows[0] || {})[k], colFormats[k] || {})
                  }))
                : [{ key: metric, value: value === null ? '' : value }])
            ]
          ];

          datasets.push({
            label: labelArr,
            data: [value],
            dataKey: metric,
            axisType,
            tooltipData: tooltipArr
          });
        });
      });
    }
  }

  return { datasets };
}
