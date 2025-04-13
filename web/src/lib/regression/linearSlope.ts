export const calculateLinearSlope = (data: number[]) => {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumXX += i * i;
  }

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const slopeData = data.map((item, index) => slope * index + intercept);

  // Return coefficients and function to calculate y values
  return {
    slope,
    slopeData,
    intercept,
    equation: `y = ${slope.toFixed(1)}x + ${intercept.toFixed(1)}`
  };
};
