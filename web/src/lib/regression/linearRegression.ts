export const calculateLinearRegression = (data: { x: number; y: number }[]) => {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    const { x, y } = data[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  // Calculate slope (m) and intercept (b)
  const predict = (x: number) => {
    return slope * x + intercept;
  };
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Return the equation of the line
  return {
    slopeData: data.map((item) => predict(item.x)),
    intercept,
    equation: `y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`,
    predict
  };
};
