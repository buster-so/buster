import { calculateExponentialRegression } from './exponentialRegression';

describe('calculateExponentialRegression', () => {
  it('should correctly calculate exponential regression for a simple exponential dataset', () => {
    // Test with perfect exponential growth (y = 2e^x)
    const data = [
      { x: 0, y: 2 }, // 2e^0 = 2
      { x: 1, y: 5.437 }, // ≈ 2e^1
      { x: 2, y: 14.778 }, // ≈ 2e^2
      { x: 3, y: 40.171 } // ≈ 2e^3
    ];

    const result = calculateExponentialRegression(data);

    // The coefficients should be close to a=2 and b=1
    expect(result.a).toBeCloseTo(2, 1);
    expect(result.b).toBeCloseTo(1, 1);

    // Test prediction
    const prediction = result.predict(4);
    expect(prediction).toBeCloseTo(109.196, 1); // ≈ 2e^4

    // Verify slope data length matches input
    expect(result.slopeData.length).toBe(data.length);
  });

  it('should handle real-world exponential growth data', () => {
    const data = [
      { x: 0, y: 100 },
      { x: 1, y: 120 },
      { x: 2, y: 150 },
      { x: 3, y: 185 },
      { x: 4, y: 225 }
    ];

    const result = calculateExponentialRegression(data);

    // Test basic properties
    expect(result.a).toBeGreaterThan(0);
    expect(result.slopeData.length).toBe(data.length);

    // Predictions should be monotonically increasing
    const pred1 = result.predict(5);
    const pred2 = result.predict(6);
    expect(pred2).toBeGreaterThan(pred1);
  });

  it('should throw error for negative y values', () => {
    const data = [
      { x: 0, y: 1 },
      { x: 1, y: -2 },
      { x: 2, y: 4 }
    ];

    expect(() => calculateExponentialRegression(data)).toThrow(
      'Exponential regression requires all y values to be positive'
    );
  });

  it('should handle edge cases', () => {
    // Test with single point
    expect(() => calculateExponentialRegression([{ x: 0, y: 1 }])).toThrow();

    // Test with empty array
    expect(() => calculateExponentialRegression([])).toThrow();

    // Test with zero y values
    const zeroData = [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ];
    expect(() => calculateExponentialRegression(zeroData)).toThrow();
  });

  it('should handle timestamp-based exponential growth data with daily intervals', () => {
    const data = [
      { x: 1704092400000, y: 100 },
      { x: 1704178800000, y: 150 },
      { x: 1704265200000, y: 225 },
      { x: 1704351600000, y: 338 },
      { x: 1704438000000, y: 506 },
      { x: 1704524400000, y: 759 },
      { x: 1704610800000, y: 1139 },
      { x: 1704697200000, y: 1709 },
      { x: 1704783600000, y: 2563 },
      { x: 1704870000000, y: 3844 },
      { x: 1704956400000, y: 5767 },
      { x: 1705042800000, y: 8650 }
    ];

    // Normalize timestamps to days since start for better numerical stability
    const normalizedData = data.map((point) => ({
      x: (point.x - data[0].x) / (24 * 60 * 60 * 1000), // Convert to days
      y: point.y
    }));

    const result = calculateExponentialRegression(normalizedData);

    // The data roughly follows y = 100 * (1.5)^x where x is days
    // So we expect a ≈ 100 and b ≈ ln(1.5) ≈ 0.405

    // Test if we get reasonable coefficients
    expect(result.a).toBeCloseTo(100, 0);
    expect(result.b).toBeCloseTo(0.405, 1);

    // Test R-squared - should be very close to 1 for this well-behaved data
    expect(result.rSquared).toBeGreaterThan(0.99);

    // Test predictions
    const day13Prediction = result.predict(12); // Predict day 13
    expect(day13Prediction).toBeGreaterThan(8650); // Should be higher than last point
    expect(day13Prediction).toBeLessThan(15000); // But not unreasonably higher

    // Verify slope data matches input length
    expect(result.slopeData.length).toBe(normalizedData.length);

    // Test if predictions are monotonically increasing
    for (let i = 1; i < result.slopeData.length; i++) {
      expect(result.slopeData[i]).toBeGreaterThan(result.slopeData[i - 1]);
    }
  });
});
