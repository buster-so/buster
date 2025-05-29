import { describe, it, expect } from 'vitest';
import { uniformSampling, randomSampling } from './downsample';
import type { DataPoint } from './downsample';
import { detectAnomalies } from './downsample';

describe('uniformSampling', () => {
  // Sample data for testing
  const testData: DataPoint[] = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 30 },
    { x: 3, y: 40 },
    { x: 4, y: 50 },
    { x: 5, y: 60 },
    { x: 6, y: 70 },
    { x: 7, y: 80 },
    { x: 8, y: 90 },
    { x: 9, y: 100 }
  ];

  it('should return original data if targetPoints is greater than or equal to data length', () => {
    // Test with targetPoints equal to data length
    const result1 = uniformSampling(testData, 10);
    expect(result1).toBe(testData);

    // Test with targetPoints greater than data length
    const result2 = uniformSampling(testData, 15);
    expect(result2).toBe(testData);
  });

  it('should return just first and last points when targetPoints is 2', () => {
    const result = uniformSampling(testData, 2);

    expect(result.length).toBe(2);
    expect(result[0]).toEqual(testData[0]);
    expect(result[1]).toEqual(testData[testData.length - 1]);
  });

  it('should sample points at regular intervals when targetPoints is between 2 and data length', () => {
    const targetPoints = 5;
    const result = uniformSampling(testData, targetPoints);

    // Should have exactly the requested number of points
    expect(result.length).toBe(targetPoints);

    // First and last points should be the same as original data
    expect(result[0]).toEqual(testData[0]);
    expect(result[result.length - 1]).toEqual(testData[testData.length - 1]);

    // Check that intermediate points are at expected positions
    // For example, with 5 points from 10, we'd expect points at indices 0, 3, 6, 8, 9
    // This is because we include first and last points and space the middle 3 evenly
    const step = (testData.length - 2) / (targetPoints - 2);

    for (let i = 1; i < targetPoints - 1; i++) {
      const expectedIndex = Math.floor(1 + i * step);
      expect(result[i]).toEqual(testData[expectedIndex]);
    }
  });

  it('should handle null or empty input appropriately', () => {
    expect(uniformSampling(null, 5)).toEqual([]);
    expect(uniformSampling([], 5)).toEqual([]);
  });

  it('should efficiently sample from a large dataset of 1000 points', () => {
    // Generate a dataset with 1000 points
    const largeDataset: DataPoint[] = Array.from({ length: 1000 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.01) * 100 + 100 // Generate sine wave data
    }));

    const targetPoints = 50;
    const result = uniformSampling(largeDataset, targetPoints);

    // Should have exactly the requested number of points
    expect(result.length).toBe(targetPoints);

    // First and last points should be the same as original data
    expect(result[0]).toEqual(largeDataset[0]);
    expect(result[result.length - 1]).toEqual(largeDataset[largeDataset.length - 1]);

    // Verify that intermediate points are properly sampled
    const step = (largeDataset.length - 2) / (targetPoints - 2);

    // Check a few specific points
    const pointsToCheck = [1, Math.floor(targetPoints / 2), targetPoints - 2];

    for (const i of pointsToCheck) {
      const expectedIndex = Math.floor(1 + i * step);
      expect(result[i]).toEqual(largeDataset[expectedIndex]);
    }
  });
});

describe('randomSampling', () => {
  // Sample data for testing
  const testData: DataPoint[] = [
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: 30 },
    { x: 3, y: 40 },
    { x: 4, y: 50 },
    { x: 5, y: 60 },
    { x: 6, y: 70 },
    { x: 7, y: 80 },
    { x: 8, y: 90 },
    { x: 9, y: 100 }
  ];

  it('should return original data if targetPoints is greater than or equal to data length', () => {
    // Test with targetPoints equal to data length
    const result1 = randomSampling(testData, 10);
    expect(result1).toBe(testData);

    // Test with targetPoints greater than data length
    const result2 = randomSampling(testData, 15);
    expect(result2).toBe(testData);
  });

  it('should return first and last points when preserveEnds is true and targetPoints is 2', () => {
    const result = randomSampling(testData, 2, true);

    expect(result.length).toBe(2);
    expect(result[0]).toEqual(testData[0]); // First point
    expect(result[1]).toEqual(testData[testData.length - 1]); // Last point
  });

  it('should return exactly targetPoints number of points', () => {
    const targetPoints = 5;
    const result = randomSampling(testData, targetPoints);

    expect(result.length).toBe(targetPoints);

    // With default preserveEnds=true, first and last points should be preserved
    expect(result[0]).toEqual(testData[0]);
    expect(result[result.length - 1]).toEqual(testData[testData.length - 1]);
  });

  it('should not include first and last points when preserveEnds is false', () => {
    const targetPoints = 5;
    const result = randomSampling(testData, targetPoints, false);

    expect(result.length).toBe(targetPoints);

    // Points should be randomly selected but maintained in original order
    let isOrdered = true;
    const indices = testData
      .map((point, index) => {
        const resultIndex = result.findIndex((p) => p === point);
        return resultIndex !== -1 ? index : -1;
      })
      .filter((index) => index !== -1);

    for (let i = 1; i < indices.length; i++) {
      if (indices[i] < indices[i - 1]) {
        isOrdered = false;
        break;
      }
    }

    expect(isOrdered).toBe(true);
  });

  it('should handle null or empty input appropriately', () => {
    expect(randomSampling(null, 5)).toEqual([]);
    expect(randomSampling([], 5)).toEqual([]);

    // Test with preserveEnds=false
    expect(randomSampling(null, 5, false)).toEqual([]);
    expect(randomSampling([], 5, false)).toEqual([]);

    // Edge case: should handle targetPoints=1 correctly
    const singlePoint = randomSampling(testData, 1, true);
    expect(singlePoint.length).toBe(1);
    expect(singlePoint[0]).toEqual(testData[0]); // With preserveEnds, should be first point

    const singlePointNoPreserve = randomSampling(testData, 1, false);
    expect(singlePointNoPreserve.length).toBe(1);
    // With preserveEnds=false, should be any point from the dataset
    expect(testData).toContainEqual(singlePointNoPreserve[0]);
  });

  it('should efficiently handle very large datasets with performance testing', () => {
    // Generate a complex dataset with over 10,000 points
    const veryLargeDataset: DataPoint[] = Array.from({ length: 10000 }, (_, i) => ({
      x: i,
      y: Math.sin(i * 0.005) * 50 + Math.cos(i * 0.002) * 30 + 100, // Complex wave pattern
      z: i % 5, // Add another property to make objects more complex
      timestamp: new Date(2023, 0, 1, 0, 0, i % 60, i % 1000) // Add date objects too
    }));

    // Performance test - measure time to downsample
    const startTime = performance.now();

    // Test downsampling to different sizes
    const sampledLarge = randomSampling(veryLargeDataset, 500, true);
    const sampledMedium = randomSampling(veryLargeDataset, 100, true);
    const sampledSmall = randomSampling(veryLargeDataset, 50, false);

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Verify correct number of points
    expect(sampledLarge.length).toBe(500);
    expect(sampledMedium.length).toBe(100);
    expect(sampledSmall.length).toBe(50);

    // With preserveEnds=true, first and last points should be preserved
    expect(sampledLarge[0]).toEqual(veryLargeDataset[0]);
    expect(sampledLarge[sampledLarge.length - 1]).toEqual(
      veryLargeDataset[veryLargeDataset.length - 1]
    );
    expect(sampledMedium[0]).toEqual(veryLargeDataset[0]);
    expect(sampledMedium[sampledMedium.length - 1]).toEqual(
      veryLargeDataset[veryLargeDataset.length - 1]
    );

    // With preserveEnds=false, we expect random selection but points should still come from the dataset
    sampledSmall.forEach((point) => {
      const found = veryLargeDataset.some((dataPoint) => {
        // Check numeric and string properties
        const basicPropsMatch =
          dataPoint.x === point.x && dataPoint.y === point.y && dataPoint.z === point.z;

        // Handle timestamp date comparison separately with proper type checking
        const timestampMatches =
          dataPoint.timestamp instanceof Date && point.timestamp instanceof Date
            ? dataPoint.timestamp.getTime() === point.timestamp.getTime()
            : dataPoint.timestamp === point.timestamp;

        return basicPropsMatch && timestampMatches;
      });
      expect(found).toBe(true);
    });

    expect(executionTime).toBeLessThan(200);
  });
});

describe('detectAnomalies', () => {
  it('should correctly identify anomalous points based on standard deviation', () => {
    const testData: DataPoint[] = [
      { value: 10 },
      { value: 12 },
      { value: 9 },
      { value: 11 },
      { value: 10 }, // Anomaly
      { value: 13 },
      { value: 8 },
      { value: 100 }, // Anomaly
      { value: 11 },
      { value: 10 }
    ];

    const anomalies = detectAnomalies(testData, 'value', 1.5);

    // Should identify indices 4 and 7 as anomalous
    expect(anomalies).toHaveLength(1);
    expect(anomalies).toContain(7);
    expect(testData[anomalies[0]].value).toBe(100);
  });
});

describe('randomSampling with anomaly preservation', () => {
  it('should preserve anomalous points while downsampling', () => {
    const testData: DataPoint[] = [
      { value: 10 },
      { value: 12 },
      { value: 9 },
      { value: 11 },
      { value: 10 },
      { value: 13 },
      { value: 8 },
      { value: 100 }, // Anomaly
      { value: 11 },
      { value: 10 }
    ];

    // Request 5 points with anomaly preservation
    const result = randomSampling(testData, 5, true, {
      numericField: 'value',
      threshold: 1.5
    });

    // Should have exactly 5 points
    expect(result).toHaveLength(5);

    // Should include the anomalous point
    const resultValues = result.map((point) => point.value);
    expect(resultValues).toContain(100);

    // Should include first and last points (preserveEnds = true)
    expect(resultValues).toContain(10); // first point
    expect(resultValues[0]).toBe(10); // first point should be first
    expect(resultValues[resultValues.length - 1]).toBe(10); // last point should be last
  });
});
