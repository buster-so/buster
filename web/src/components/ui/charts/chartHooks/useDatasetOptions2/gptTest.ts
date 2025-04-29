type KV = { key: string; value: string | number };

type ColumnLabelFormatBase = {
  replaceMissingDataWith?: 0 | null | string;
  // …other formatting options
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
  // Normalize keys
  const xKeys = axis.x.map(String);
  const yKeys = axis.y.map(String);
  const y2Keys = (axis.y2 || []).map(String);
  const sizeKeys = (axis.size || []).map(String);
  const tooltipKeys = axis.tooltips ? axis.tooltips.map(String) : null;
  const catKeys = axis.category ? axis.category.map(String) : [];

  // Helper to build unique combos of a given key-set
  function buildCombos(keys: string[]): Array<Record<string, string>> {
    const map = new Map<string, Record<string, string>>();
    data.forEach((r) => {
      const rec: Record<string, string> = {};
      keys.forEach((k) => {
        rec[k] = String(r[k]);
      });
      const key = keys.map((k) => rec[k]).join('|');
      if (!map.has(key)) map.set(key, rec);
    });
    return Array.from(map.values());
  }

  // Decide grouping keys for non-scatter
  const groupKeysSet = catKeys.length > 0 ? catKeys : xKeys;

  // Build dimension combos (either category combos or x combos)
  const dimCombos = scatterPlot
    ? [] // scatter handled separately
    : buildCombos(groupKeysSet);

  // Prepare series metadata
  type Meta = { key: string; axisType: 'y' | 'y2' };
  const seriesMeta: Meta[] = [
    ...yKeys.map((k) => ({ key: k, axisType: 'y' as const })),
    ...y2Keys.map((k) => ({ key: k, axisType: 'y2' as const }))
  ];

  const datasets: Dataset[] = [];

  if (scatterPlot) {
    // SERIES = Cartesian product of yKeys × category (if any) else just yKeys
    type SeriesDef = { yKey: string; categoryRec?: Record<string, string> };
    const seriesDefs: SeriesDef[] = [];

    if (catKeys.length) {
      const cats = buildCombos(catKeys);
      cats.forEach((catRec) =>
        yKeys.forEach((yKey) => seriesDefs.push({ yKey, categoryRec: catRec }))
      );
    } else {
      yKeys.forEach((yKey) => seriesDefs.push({ yKey }));
    }

    // Build scatter datasets
    seriesDefs.forEach(({ yKey, categoryRec }) => {
      // Filter rows
      const rows = categoryRec
        ? data.filter(
            (r) =>
              catKeys.map((k) => String(r[k])).join('|') ===
              catKeys.map((k) => categoryRec[k]).join('|')
          )
        : data.slice();

      const fmt = columnLabelFormats[yKey] || {};
      const missing = fmt.replaceMissingDataWith ?? 0;

      // Build data & size arrays
      const dataArr = rows.map((r) => {
        const raw = r[yKey],
          n = Number(raw);
        return raw == null || raw === '' || Number.isNaN(n)
          ? missing === null
            ? null
            : Number(missing)
          : n;
      });

      let sizeArr: (number | null)[] | undefined;
      if (sizeKeys.length) {
        const szKey = sizeKeys[0];
        const szFmt = columnLabelFormats[szKey] || {};
        const szMiss = szFmt.replaceMissingDataWith ?? 0;
        sizeArr = rows.map((r) => {
          const raw = r[szKey],
            n = Number(raw);
          return raw == null || raw === '' || Number.isNaN(n)
            ? szMiss === null
              ? null
              : Number(szMiss)
            : n;
        });
      }

      // Build label[][] and tooltipData[][]
      const labelArr = rows.map((r) => xKeys.map((k) => ({ key: k, value: r[k] })));
      const tooltipArr = rows.map((r, i) => {
        const pts: KV[] = [];
        if (categoryRec) {
          catKeys.forEach((k) => pts.push({ key: k, value: categoryRec[k]! }));
        }
        if (tooltipKeys) {
          tooltipKeys.forEach((k) => {
            const raw = r[k],
              num = Number(raw);
            pts.push({
              key: k,
              value: raw == null || raw === '' || Number.isNaN(num) ? '' : num
            });
          });
        } else {
          pts.push({ key: yKey, value: dataArr[i] == null ? '' : dataArr[i]! });
        }
        return pts;
      });

      datasets.push({
        label: labelArr,
        data: dataArr,
        dataKey: yKey,
        axisType: seriesMeta.find((m) => m.key === yKey)!.axisType,
        tooltipData: tooltipArr,
        ...(sizeArr && { sizeData: sizeArr })
      });
    });
  } else {
    // NON-SCATTER: series = Cartesian product of seriesMeta × dimCombos
    seriesMeta.forEach(({ key: metric, axisType }) => {
      const fmt = columnLabelFormats[metric] || {};
      const missing = fmt.replaceMissingDataWith ?? 0;

      dimCombos.forEach((comboRec) => {
        // Filter rows matching this combo
        const rows = data.filter(
          (r) =>
            groupKeysSet.map((k) => String(r[k])).join('|') ===
            groupKeysSet.map((k) => comboRec[k]).join('|')
        );

        // Sum values
        let sum = 0,
          sawNull = false;
        rows.forEach((r) => {
          const raw = r[metric],
            n = Number(raw);
          if (raw == null || raw === '' || Number.isNaN(n)) {
            if (missing === null) sawNull = true;
            else sum += Number(missing);
          } else sum += n;
        });
        const value = sawNull ? null : sum;

        // Build label/tooltip for this single point
        const labelKV: KV[] = groupKeysSet.map((k) => ({
          key: k,
          value: comboRec[k]
        }));
        const labelArr = [labelKV];

        const tooltipKV: KV[] = [];
        if (tooltipKeys) {
          // pick from first row of this group
          const first = rows[0] || ({} as any);
          tooltipKeys.forEach((k) => {
            const raw = first[k],
              num = Number(raw);
            tooltipKV.push({
              key: k,
              value: raw == null || raw === '' || Number.isNaN(num) ? '' : num
            });
          });
        } else {
          tooltipKV.push({
            key: metric,
            value: value === null ? '' : value
          });
        }
        const tooltipArr = [tooltipKV];

        let sizeArr: (number | null)[] | undefined;
        if (sizeKeys.length) {
          const szKey = sizeKeys[0];
          const first = rows[0] || ({} as any);
          const raw = first[szKey],
            n = Number(raw);
          const szFmt = columnLabelFormats[szKey] || {};
          const szMiss = szFmt.replaceMissingDataWith ?? 0;
          const v =
            raw == null || raw === '' || Number.isNaN(n)
              ? szMiss === null
                ? null
                : Number(szMiss)
              : n;
          sizeArr = [v];
        }

        datasets.push({
          label: labelArr,
          data: [value],
          dataKey: metric,
          axisType,
          tooltipData: tooltipArr,
          ...(sizeArr && { sizeData: sizeArr })
        });
      });
    });
  }

  return { datasets };
}
