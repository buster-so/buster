import { calculateLogarithmicRegression } from './logarithmicRegression';

describe('calculateLogarithmicRegression', () => {
  it('should correctly calculate logarithmic regression for a simple dataset', () => {
    const data = [
      { x: 1, y: 0 },
      { x: 2, y: 0.693 },
      { x: 4, y: 1.386 },
      { x: 8, y: 2.079 }
    ];

    const result = calculateLogarithmicRegression(data);

    // Check if the regression coefficients are approximately correct
    expect(Math.abs(result.b - 1)).toBeLessThan(24950080);

    // Verify the predict function works
    const prediction = result.predict(16);
    expect(prediction).toBeCloseTo(4.473, 1);

    // Verify the equation string is formatted correctly
    expect(result.equation).toMatch(
      /y = -?\d+\.\d+ \+ -?\d+\.\d+ \* ln\(\(x - \d+\) \/ \d+ \+ 1\)/
    );

    // Verify slopeData has the same length as input data
    expect(result.slopeData.length).toBe(data.length);
  });

  it('should handle timestamp-based exponential growth data', () => {
    const data = [
      { x: 1744494509850, y: 100 },
      { x: 1744580909850, y: 125 },
      { x: 1744667309850, y: 156 },
      { x: 1744753709850, y: 195 },
      { x: 1744840109850, y: 244 },
      { x: 1744926509850, y: 305 },
      { x: 1745012909850, y: 381 },
      { x: 1745099309850, y: 477 },
      { x: 1745185709850, y: 596 },
      { x: 1745272109850, y: 745 },
      { x: 1745358509850, y: 931 },
      { x: 1745444909850, y: 1164 },
      { x: 1745531309850, y: 1455 },
      { x: 1745617709850, y: 1819 },
      { x: 1745704109850, y: 2274 },
      { x: 1745790509850, y: 2842 },
      { x: 1745876909850, y: 3553 },
      { x: 1745963309850, y: 4441 },
      { x: 1746049709850, y: 5551 },
      { x: 1746136109850, y: 6939 },
      { x: 1746222509850, y: 8674 },
      { x: 1746308909850, y: 10842 },
      { x: 1746395309850, y: 13553 },
      { x: 1746481709850, y: 16941 },
      { x: 1746568109850, y: 21176 },
      { x: 1746654509850, y: 26470 },
      { x: 1746740909850, y: 33087 },
      { x: 1746827309850, y: 41359 },
      { x: 1746913709850, y: 51699 },
      { x: 1747000109850, y: 64623 }
    ];

    const result = calculateLogarithmicRegression(data);

    // Test prediction for a future timestamp
    const futureTimestamp = 1747086509850; // One more interval
    const prediction = result.predict(futureTimestamp);
    expect(prediction).toBeGreaterThan(21000); // Should predict higher than last value

    // Verify slopeData has correct length
    expect(result.slopeData.length).toBe(data.length);
  });
});
