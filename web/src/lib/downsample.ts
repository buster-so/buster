export type DataPoint = Record<string, string | number | null | Date>;

/**
 * Detects anomalous points in a dataset using statistical methods
 * @param data - Array of data points to analyze
 * @param numericField - The field name containing numeric values to check for anomalies
 * @param threshold - Number of standard deviations to consider anomalous (default: 2)
 * @returns Array of indices of anomalous points
 */
export function detectAnomalies(data: DataPoint[], numericField: string, threshold = 2): number[] {
  const values = data.map((point) => Number(point[numericField])).filter((val) => !isNaN(val));

  if (values.length === 0) return [];

  // Calculate mean and standard deviation
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Find indices of anomalous points
  return data.reduce<number[]>((indices, point, index) => {
    const value = Number(point[numericField]);
    if (isNaN(value)) return indices;

    if (Math.abs(value - mean) > threshold * stdDev) {
      indices.push(index);
    }
    return indices;
  }, []);
}

/**
 * Uniform sampling - selects points at regular intervals
 * @param data - Array of data points to downsample
 * @param targetPoints - Target number of points in the downsampled dataset
 * @returns Downsampled array with exactly targetPoints number of points (or original if already smaller)
 */
export function uniformSampling(data: DataPoint[] | null, targetPoints: number): DataPoint[] {
  if (!data || data.length <= targetPoints) {
    return data || [];
  }

  const result: DataPoint[] = [];

  // Always include the first and last points
  result.push(data[0]);

  // If we only want 2 points, just return first and last
  if (targetPoints === 2) {
    result.push(data[data.length - 1]);
    return result;
  }

  // Calculate the step size to get targetPoints - 2 intermediate points
  const step = (data.length - 2) / (targetPoints - 2);

  // Select intermediate points at regular intervals
  for (let i = 1; i < targetPoints - 1; i++) {
    const index = Math.floor(1 + i * step);
    result.push(data[index]);
  }

  // Add the last point
  result.push(data[data.length - 1]);

  return result;
}

/**
 * Random sampling - selects points randomly while preserving anomalous points
 * @param data - Array of data points to downsample
 * @param targetPoints - Target number of points in the downsampled dataset
 * @param preserveEnds - Whether to always include the first and last points (default: true)
 * @param anomalyOptions - Options for anomaly detection (optional)
 * @returns Downsampled array with exactly targetPoints number of points (or original if already smaller)
 */
export function randomSampling(
  data: DataPoint[] | null,
  targetPoints: number,
  preserveEnds = true,
  anomalyOptions?: {
    numericField: string;
    threshold?: number;
  }
): DataPoint[] {
  if (!data || data.length <= targetPoints) {
    return data || [];
  }

  if (preserveEnds && targetPoints < 2) {
    return data.slice(0, 1);
  }

  const result: DataPoint[] = [];
  let remainingTarget = targetPoints;

  // Add first point if preserving ends
  if (preserveEnds) {
    result.push(data[0]);
    remainingTarget--;
  }

  // Detect and add anomalous points if options provided
  const anomalousIndices = anomalyOptions
    ? detectAnomalies(data, anomalyOptions.numericField, anomalyOptions.threshold)
    : [];

  // Filter out ends if they're in anomalous points
  const filteredAnomalousIndices = anomalousIndices.filter(
    (idx) => !preserveEnds || (idx !== 0 && idx !== data.length - 1)
  );

  // Add anomalous points within our target limit
  const anomalousPoints = filteredAnomalousIndices
    .slice(0, remainingTarget)
    .map((idx) => data[idx]);
  result.push(...anomalousPoints);
  remainingTarget -= anomalousPoints.length;

  // Create array of available indices (excluding anomalous points and ends)
  const availableIndices = Array.from(Array(data.length).keys()).filter(
    (i) =>
      (!preserveEnds || (i !== 0 && i !== data.length - 1)) && !filteredAnomalousIndices.includes(i)
  );

  // Randomly select remaining points
  while (remainingTarget > (preserveEnds ? 1 : 0) && availableIndices.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const dataIndex = availableIndices[randomIndex];
    availableIndices.splice(randomIndex, 1);
    result.push(data[dataIndex]);
    remainingTarget--;
  }

  // Add last point if preserving ends
  if (preserveEnds) {
    result.push(data[data.length - 1]);
  }

  // Sort the result by the original index to maintain order
  return result.sort((a, b) => data.indexOf(a) - data.indexOf(b));
}
