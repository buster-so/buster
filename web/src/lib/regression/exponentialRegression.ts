export const calculateExponentialRegression = (data: { x: number; y: number }[]) => {
  // Input validation
  if (data.length < 2) {
    throw new Error('At least two data points are required for exponential regression');
  }

  // Validate data - all y values must be positive
  if (data.some((point) => point.y <= 0)) {
    throw new Error('Exponential regression requires all y values to be positive');
  }

  const n = data.length;

  // Normalize x values relative to the first x value for numerical stability
  const xOffset = data[0].x;
  const normalizedData = data.map((point) => ({
    x: point.x - xOffset,
    y: point.y
  }));

  // If x values are large (e.g., timestamps), scale them down
  const maxX = Math.max(...normalizedData.map((p) => Math.abs(p.x)));
  const xScaleFactor = maxX > 1000 ? maxX : 1;

  // Apply scaling to x values
  normalizedData.forEach((point) => {
    point.x = point.x / xScaleFactor;
  });

  let sumX = 0;
  let sumLnY = 0;
  let sumXLnY = 0;
  let sumXX = 0;

  // Transform to linear space using natural log
  // For y = ae^(bx), ln(y) = ln(a) + bx
  for (const { x, y } of normalizedData) {
    const lnY = Math.log(y);
    sumX += x;
    sumLnY += lnY;
    sumXLnY += x * lnY;
    sumXX += x * x;
  }

  // Calculate coefficients
  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) {
    throw new Error('Cannot compute regression: x values are all identical');
  }

  const b = (n * sumXLnY - sumX * sumLnY) / denominator;
  const lnA = (sumLnY - b * sumX) / n;
  const a = Math.exp(lnA);

  // Adjust b coefficient for the x scaling
  const bScaled = b / xScaleFactor;

  // Create predict function that handles the original x scale
  const predict = (x: number) => {
    const xNormalized = (x - xOffset) / xScaleFactor;
    return a * Math.exp(b * xNormalized);
  };

  // Calculate fitted values and R-squared
  const yMean = data.reduce((sum, point) => sum + point.y, 0) / n;
  let ssRes = 0; // Sum of squares of residuals
  let ssTot = 0; // Total sum of squares

  const slopeData = data.map((point) => {
    const yPred = predict(point.x);
    ssRes += Math.pow(point.y - yPred, 2);
    ssTot += Math.pow(point.y - yMean, 2);
    return yPred;
  });

  const rSquared = 1 - ssRes / ssTot;

  return {
    a, // coefficient (y = ae^(bx))
    b: bScaled, // exponent coefficient (adjusted for x scale)
    rSquared, // goodness of fit
    slopeData, // fitted y values
    equation: `y = ${a.toFixed(3)} * e^(${bScaled.toExponential(3)}x)`,
    predict // function to predict y for any x
  };
};
