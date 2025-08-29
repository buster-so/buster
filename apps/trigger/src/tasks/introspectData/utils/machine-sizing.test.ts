import { describe, expect, it } from 'vitest';
import {
  calculateMachineSize,
  calculateSizingInfo,
  formatBytes,
  getMachineSpecs,
} from './machine-sizing';

describe('Machine Sizing Utility', () => {
  describe('calculateMachineSize', () => {
    it('should return medium-1x for small tables due to base overhead', () => {
      // 1MB table, sampling 1000 rows (under 100k threshold)
      const rowCount = 10_000;
      const sizeBytes = 1 * 1024 * 1024; // 1MB
      const sampleSize = 1_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 100KB * 20 + 500MB = ~520MB > 500MB threshold → medium-1x
      expect(result).toBe('medium-1x');
    });

    it('should return medium-2x for tables with 100K sample size', () => {
      // 200MB table, sampling 100K rows
      const rowCount = 1_000_000;
      const sizeBytes = 200 * 1024 * 1024; // 200MB
      const sampleSize = 100_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 100K samples now require medium-2x (4GB RAM) for stability
      expect(result).toBe('medium-2x');
    });

    it('should return large-2x for tables with 250K sample size and large data', () => {
      // 2GB table, sampling 250K rows
      const rowCount = 1_000_000;
      const sizeBytes = 2 * 1024 * 1024 * 1024; // 2GB
      const sampleSize = 250_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 500MB * 20 + 500MB = 10.5GB → large-2x (exceeds 2GB threshold)
      expect(result).toBe('large-2x');
    });

    it('should return large-2x for tables with 500K sample size and large data', () => {
      // 3GB table, sampling 500K rows
      const rowCount = 1_000_000;
      const sizeBytes = 3 * 1024 * 1024 * 1024; // 3GB
      const sampleSize = 500_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 1.5GB * 20 + 500MB = 30.5GB → large-2x
      expect(result).toBe('large-2x');
    });

    it('should return large-2x for tables with 750K+ sample size', () => {
      // 10GB table, sampling 750K rows (hits maximum threshold)
      const rowCount = 1_000_000;
      const sizeBytes = 10 * 1024 * 1024 * 1024; // 10GB
      const sampleSize = 750_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      expect(result).toBe('large-2x'); // Minimum threshold for 750K samples
    });

    it('should handle views with 1M sample size correctly', () => {
      // Large view with 10M rows, 100GB total, sampling 1M rows
      const rowCount = 10_000_000;
      const sizeBytes = 100 * 1024 * 1024 * 1024; // 100GB
      const sampleSize = 1_000_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      expect(result).toBe('large-2x'); // Exceeds 750K threshold → large-2x
    });

    it('should return large-1x when size information is missing', () => {
      const result = calculateMachineSize(1000, undefined, 100);
      expect(result).toBe('large-1x');
    });

    it('should return large-1x when size is zero', () => {
      const result = calculateMachineSize(1000, 0, 100);
      expect(result).toBe('large-1x');
    });

    it('should return large-1x when row count is zero', () => {
      const result = calculateMachineSize(0, 1000, 100);
      expect(result).toBe('large-1x');
    });
  });

  describe('calculateSizingInfo', () => {
    it('should calculate detailed sizing information correctly', () => {
      const rowCount = 1_000_000;
      const sizeBytes = 1 * 1024 * 1024 * 1024; // 1GB
      const sampleSize = 100_000; // 100K rows

      const info = calculateSizingInfo(rowCount, sizeBytes, sampleSize);

      expect(info.machinePreset).toBe('large-1x'); // 100MB * 20 + 500MB = 2.5GB, fits in large-1x (4GB threshold)
      expect(info.avgRowSizeBytes).toBe(1073.741824); // 1GB / 1M rows
      expect(info.estimatedSampleBytes).toBeCloseTo(107374182.4, 1); // ~100MB
      // With new multipliers: 107374182.4 * 10 * 2 + 500MB = 2671771648
      expect(info.estimatedMemoryRequired).toBe(2671771648);
      expect(info.machineSpecs).toBe('4 vCPU, 8GB RAM'); // large-1x specs
    });

    it('should handle missing size information', () => {
      const info = calculateSizingInfo(1000, undefined, 100);

      expect(info.machinePreset).toBe('large-1x');
      expect(info.avgRowSizeBytes).toBe(0);
      expect(info.estimatedSampleBytes).toBe(0);
      expect(info.estimatedMemoryRequired).toBe(0);
      expect(info.machineSpecs).toBe('4 vCPU, 8GB RAM');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(512)).toBe('512 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
      expect(formatBytes(1073741824)).toBe('1 GB');
      expect(formatBytes(1099511627776)).toBe('1 TB');
    });
  });

  describe('getMachineSpecs', () => {
    it('should return correct specs for each preset', () => {
      expect(getMachineSpecs('micro')).toBe('0.25 vCPU, 0.25GB RAM');
      expect(getMachineSpecs('small-1x')).toBe('0.5 vCPU, 0.5GB RAM');
      expect(getMachineSpecs('small-2x')).toBe('1 vCPU, 1GB RAM');
      expect(getMachineSpecs('medium-1x')).toBe('1 vCPU, 2GB RAM');
      expect(getMachineSpecs('medium-2x')).toBe('2 vCPU, 4GB RAM');
      expect(getMachineSpecs('large-1x')).toBe('4 vCPU, 8GB RAM');
      expect(getMachineSpecs('large-2x')).toBe('8 vCPU, 16GB RAM');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle small lookup table correctly', () => {
      // Small country codes table: 250 rows, 256KB total
      const rowCount = 250;
      const sizeBytes = 256 * 1024;
      const sampleSize = 250; // Under 100K threshold

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 256KB * 20 + 500MB = ~505MB → medium-1x (exceeds 500MB threshold)
      expect(result).toBe('medium-1x');
    });

    it('should handle medium transaction table correctly', () => {
      // Transactions table: 5M rows, 2GB total
      const rowCount = 5_000_000;
      const sizeBytes = 2 * 1024 * 1024 * 1024;
      const sampleSize = 250_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 100MB * 20 + 500MB = 2.5GB, with 250K threshold forces medium-2x
      // Calculation gives large-1x (between 2GB and 4GB)
      expect(result).toBe('large-1x');
    });

    it('should handle large fact table correctly', () => {
      // Large fact table: 50M rows, 50GB total
      const rowCount = 50_000_000;
      const sizeBytes = 50 * 1024 * 1024 * 1024;
      const sampleSize = 500_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // 500MB * 20 + 500MB = 10.5GB, exceeds large-1x (2GB)
      expect(result).toBe('large-2x');
    });

    it('should handle huge data warehouse table correctly', () => {
      // Huge table: 1B rows, 1TB total
      const rowCount = 1_000_000_000;
      const sizeBytes = 1024 * 1024 * 1024 * 1024; // 1TB
      const sampleSize = 500_000;

      const result = calculateMachineSize(rowCount, sizeBytes, sampleSize);
      // With huge row size, even 500K sample exceeds thresholds
      expect(result).toBe('large-2x');
    });
  });
});
