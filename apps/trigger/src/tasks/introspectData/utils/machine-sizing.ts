/**
 * Machine preset options for Trigger.dev tasks
 */
export type MachinePreset =
  | 'micro'
  | 'small-1x'
  | 'small-2x'
  | 'medium-1x'
  | 'medium-2x'
  | 'large-1x'
  | 'large-2x';

/**
 * Machine configuration thresholds based on estimated memory requirements
 * These align with actual Trigger.dev machine RAM sizes
 */
const MACHINE_THRESHOLDS = {
  SMALL_1X: 250 * 1024 * 1024, // 250MB -> small-1x (0.5GB RAM)
  SMALL_2X: 500 * 1024 * 1024, // 500MB -> small-2x (1GB RAM)
  MEDIUM_1X: 1 * 1024 * 1024 * 1024, // 1GB -> medium-1x (2GB RAM)
  MEDIUM_2X: 2 * 1024 * 1024 * 1024, // 2GB -> medium-2x (4GB RAM)
  LARGE_1X: 4 * 1024 * 1024 * 1024, // 4GB -> large-1x (8GB RAM)
  // Anything above 4GB uses large-2x (16GB RAM)
} as const;

/**
 * DuckDB memory overhead multiplier
 * DuckDB requires significant memory for columnar storage, query processing,
 * and statistical operations (sorting, grouping, percentiles, etc.)
 */
const DUCKDB_OVERHEAD_MULTIPLIER = 10;

/**
 * Additional safety buffer to prevent OOM errors
 */
const SAFETY_BUFFER_MULTIPLIER = 2.0;

/**
 * Base memory overhead for DuckDB initialization and operation (500MB)
 */
const DUCKDB_BASE_OVERHEAD_BYTES = 500 * 1024 * 1024;

/**
 * Calculate the optimal Trigger.dev machine size based on table statistics
 *
 * @param rowCount - Total number of rows in the table
 * @param sizeBytes - Total size of the table in bytes
 * @param sampleSize - Number of rows to sample (capped at 1M)
 * @returns The optimal machine preset for processing this table
 */
export function calculateMachineSize(
  rowCount: number,
  sizeBytes: number | undefined,
  sampleSize: number
): MachinePreset {
  // Default to large-1x if we don't have size information
  // This ensures we have enough memory even for unknown table sizes
  if (!sizeBytes || sizeBytes === 0 || rowCount === 0) {
    return 'large-1x';
  }

  // Calculate average row size
  const avgRowSizeBytes = sizeBytes / rowCount;

  // Estimate the size of the sample data
  const estimatedSampleBytes = avgRowSizeBytes * sampleSize;

  // Apply DuckDB overhead and safety buffer, plus base overhead
  const estimatedMemoryRequired =
    estimatedSampleBytes * DUCKDB_OVERHEAD_MULTIPLIER * SAFETY_BUFFER_MULTIPLIER +
    DUCKDB_BASE_OVERHEAD_BYTES;

  // Apply minimum thresholds based on sample size
  // These are based on empirical observations of DuckDB memory usage
  // Updated to provide more memory for 100k+ sample sizes
  let minimumPreset: MachinePreset = 'small-2x';

  if (sampleSize >= 750000) {
    minimumPreset = 'large-2x'; // 16GB RAM for very large samples
  } else if (sampleSize >= 500000) {
    minimumPreset = 'large-1x'; // 8GB RAM
  } else if (sampleSize >= 200000) {
    minimumPreset = 'large-1x'; // 8GB RAM for 200k+ samples
  } else if (sampleSize >= 100000) {
    minimumPreset = 'medium-2x'; // 4GB RAM for 100k samples (increased from medium-1x)
  } else if (sampleSize >= 50000) {
    minimumPreset = 'medium-1x'; // 2GB RAM for 50k samples
  }

  // Select machine based on estimated memory requirements
  let calculatedPreset: MachinePreset;

  if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.SMALL_1X) {
    calculatedPreset = 'small-1x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.SMALL_2X) {
    calculatedPreset = 'small-2x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.MEDIUM_1X) {
    calculatedPreset = 'medium-1x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.MEDIUM_2X) {
    calculatedPreset = 'medium-2x';
  } else if (estimatedMemoryRequired <= MACHINE_THRESHOLDS.LARGE_1X) {
    calculatedPreset = 'large-1x';
  } else {
    calculatedPreset = 'large-2x';
  }

  // Return the larger of the calculated preset and the minimum preset
  const presetOrder: MachinePreset[] = [
    'micro',
    'small-1x',
    'small-2x',
    'medium-1x',
    'medium-2x',
    'large-1x',
    'large-2x',
  ];
  const minimumIndex = presetOrder.indexOf(minimumPreset);
  const calculatedIndex = presetOrder.indexOf(calculatedPreset);

  return presetOrder[Math.max(minimumIndex, calculatedIndex)] as MachinePreset;
}

/**
 * Get human-readable machine specifications
 */
export function getMachineSpecs(preset: MachinePreset): string {
  const specs: Record<MachinePreset, string> = {
    micro: '0.25 vCPU, 0.25GB RAM',
    'small-1x': '0.5 vCPU, 0.5GB RAM',
    'small-2x': '1 vCPU, 1GB RAM',
    'medium-1x': '1 vCPU, 2GB RAM',
    'medium-2x': '2 vCPU, 4GB RAM',
    'large-1x': '4 vCPU, 8GB RAM',
    'large-2x': '8 vCPU, 16GB RAM',
  };

  return specs[preset] || 'Unknown';
}

/**
 * Calculate and return detailed sizing information for logging
 */
export interface SizingInfo {
  machinePreset: MachinePreset;
  avgRowSizeBytes: number;
  estimatedSampleBytes: number;
  estimatedMemoryRequired: number;
  machineSpecs: string;
}

export function calculateSizingInfo(
  rowCount: number,
  sizeBytes: number | undefined,
  sampleSize: number
): SizingInfo {
  const machinePreset = calculateMachineSize(rowCount, sizeBytes, sampleSize);

  if (!sizeBytes || sizeBytes === 0 || rowCount === 0) {
    return {
      machinePreset,
      avgRowSizeBytes: 0,
      estimatedSampleBytes: 0,
      estimatedMemoryRequired: 0,
      machineSpecs: getMachineSpecs(machinePreset),
    };
  }

  const avgRowSizeBytes = sizeBytes / rowCount;
  const estimatedSampleBytes = avgRowSizeBytes * sampleSize;
  const estimatedMemoryRequired =
    estimatedSampleBytes * DUCKDB_OVERHEAD_MULTIPLIER * SAFETY_BUFFER_MULTIPLIER +
    DUCKDB_BASE_OVERHEAD_BYTES;

  return {
    machinePreset,
    avgRowSizeBytes,
    estimatedSampleBytes,
    estimatedMemoryRequired,
    machineSpecs: getMachineSpecs(machinePreset),
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
