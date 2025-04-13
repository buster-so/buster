export const calculateLogarithmicRegression = (data: { x: number; y: number }[]) => {
  if (data.length === 0) {
    throw new Error('No data provided.');
  }

  const xOffset = data[0].x; // normalize relative to first x value
  const normalized = data.map(({ x, y }) => ({
    x: (x - xOffset) / (24 * 60 * 60 * 1000), // Convert to days for better numerical stability
    y
  }));

  const filtered = normalized.filter((point) => point.x >= 0);
  const n = filtered.length;

  if (n === 0) {
    throw new Error('No valid data points with x >= base timestamp.');
  }

  let sumLnX = 0;
  let sumY = 0;
  let sumLnX2 = 0;
  let sumYLnX = 0;

  for (const { x, y } of filtered) {
    const lnX = Math.log(x + 1); // Add 1 to handle x=0 case
    sumLnX += lnX;
    sumY += y;
    sumLnX2 += lnX * lnX;
    sumYLnX += y * lnX;
  }

  const denominator = n * sumLnX2 - sumLnX * sumLnX;
  if (denominator === 0) {
    throw new Error('Denominator is zero. Cannot compute regression.');
  }

  const b = (n * sumYLnX - sumY * sumLnX) / denominator;
  const a = (sumY - b * sumLnX) / n;

  const predict = (x: number) => {
    const normalizedX = (x - xOffset) / (24 * 60 * 60 * 1000);
    if (normalizedX < 0) {
      throw new Error('Cannot predict for x < base timestamp.');
    }
    return a + b * Math.log(normalizedX + 1);
  };

  const slopeData = data.map(({ x }) => ({
    x,
    y: predict(x)
  }));

  return {
    a,
    b,
    slopeData,
    equation: `y = ${a.toFixed(1)} + ${b.toFixed(1)} * ln((x - ${xOffset}) / ${24 * 60 * 60 * 1000} + 1)`,
    predict
  };
};
