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
  // KEY NORMALIZATION
  const xKeys = axis.x.map(String);
  const yKeys = axis.y.map(String);
  const y2Keys = axis.y2?.map(String) ?? [];
  const sizeKey = axis.size?.[0] ? String(axis.size[0]) : null;
  const tooltipKeys = axis.tooltips?.map(String) ?? [];
  const catKeys = axis.category?.map(String) ?? [];

  // HELPERS
  function buildCombos(keys: string[]) {
    const map = new Map<string, Record<string, string>>();
    data.forEach((row) => {
      const rec: Record<string, string> = {};
      keys.forEach((k) => (rec[k] = String(row[k])));
      const id = keys.map((k) => rec[k]).join('|');
      if (!map.has(id)) map.set(id, rec);
    });
    return Array.from(map.values());
  }

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

  function formatTooltip(raw: any, fmt: ColumnLabelFormatBase, fallback: any): string | number {
    // Convert null/undefined/empty raw to tooltip values,
    // treating replaceMissingDataWith === null as empty string
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

  // SERIES META
  type Meta = { key: string; axisType: 'y' | 'y2' };
  const seriesMeta: Meta[] = [
    ...yKeys.map((k) => ({ key: k, axisType: 'y' as const })),
    ...y2Keys.map((k) => ({ key: k, axisType: 'y2' as const }))
  ];

  const datasets: Dataset[] = [];

  if (scatterPlot) {
    // SCATTER: Cartesian product of yKeys and category combos
    const cats = catKeys.length ? buildCombos(catKeys) : [{} as Record<string, string>];
    cats.forEach((catRec) => {
      seriesMeta
        .filter((m) => yKeys.includes(m.key))
        .forEach(({ key: yKey, axisType }) => {
          const rows = data.filter((r) => catKeys.every((k) => String(r[k]) === catRec[k]));
          const fmtY = columnLabelFormats[yKey] || {};
          const dataArr = rows.map((r) => parseNumeric(r[yKey], fmtY));

          // sizeData
          let sizeArr: (number | null)[] | undefined;
          let fmtSize: ColumnLabelFormatBase = {};
          if (sizeKey) {
            fmtSize = columnLabelFormats[sizeKey] || {};
            sizeArr = rows.map((r) => parseNumeric(r[sizeKey], fmtSize));
          }

          // labels
          const labelArr = rows.map((r) => xKeys.map((k) => ({ key: k, value: r[k] }) as KV));

          // tooltips
          const tooltipArr = rows.map((r, i) => {
            const pts: KV[] = [];
            if (tooltipKeys.length) {
              tooltipKeys.forEach((k) =>
                pts.push({
                  key: k,
                  value: formatTooltip(r[k], columnLabelFormats[k] || {}, dataArr[i])
                })
              );
            } else {
              // default for scatter: x, y, size – respecting replaceMissingDataWith
              xKeys.forEach((k) =>
                pts.push({ key: k, value: parseNumeric(r[k], columnLabelFormats[k] || {}) })
              );
              // y value
              pts.push({ key: yKey, value: formatTooltip(r[yKey], fmtY, dataArr[i]) });
              // size value
              if (sizeArr) {
                pts.push({ key: sizeKey!, value: formatTooltip(r[sizeKey!], fmtSize, sizeArr[i]) });
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
            ...(sizeArr && { sizeData: sizeArr as (number | null)[] })
          });
        });
    });
  } else {
    // NON-SCATTER
    const xCombos = buildCombos(xKeys);

    if (catKeys.length) {
      // with categories
      const cats = buildCombos(catKeys);
      seriesMeta.forEach(({ key: metric, axisType }) => {
        const fmt = columnLabelFormats[metric] || {};
        cats.forEach((catRec) => {
          const rows = data.filter((r) => catKeys.every((k) => String(r[k]) === catRec[k]));
          const dataArr = xCombos.map((xRec) => {
            const sub = rows.filter((r) => xKeys.every((k) => String(r[k]) === xRec[k]));
            let sum = 0;
            let sawNull = false;
            sub.forEach((r) => {
              const v = parseNumeric(r[metric], fmt);
              if (v === null) sawNull = true;
              else if (!Number.isNaN(v)) sum += v;
            });
            return sawNull ? null : sum;
          });

          const labelArr = xCombos.map((xRec) =>
            xKeys.map((k) => ({ key: k, value: xRec[k] }) as KV)
          );

          const tooltipArr = dataArr.map((_, i) => {
            const pts: KV[] = [];
            if (tooltipKeys.length) {
              const match =
                rows.find((r) => xKeys.every((k) => String(r[k]) === xCombos[i][k])) ||
                ({} as Record<string, any>);
              tooltipKeys.forEach((k) =>
                pts.push({
                  key: k,
                  value: formatTooltip(match[k], columnLabelFormats[k] || {}, null)
                })
              );
            } else {
              pts.push({ key: metric, value: dataArr[i] === null ? '' : dataArr[i]! });
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
      // no categories
      seriesMeta.forEach(({ key: metric, axisType }) => {
        const fmt = columnLabelFormats[metric] || {};
        xCombos.forEach((xRec) => {
          const rows = data.filter((r) => xKeys.every((k) => String(r[k]) === xRec[k]));
          let sum = 0;
          let sawNull = false;
          rows.forEach((r) => {
            const v = parseNumeric(r[metric], fmt);
            if (v === null) sawNull = true;
            else if (!Number.isNaN(v)) sum += v;
          });
          const value = sawNull ? null : sum;

          const labelArr = [xKeys.map((k) => ({ key: k, value: xRec[k] }) as KV)];

          const tooltipArr = [
            [
              ...(tooltipKeys.length
                ? tooltipKeys.map((k) => ({
                    key: k,
                    value: formatTooltip(rows[0]?.[k], columnLabelFormats[k] || {}, null)
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
