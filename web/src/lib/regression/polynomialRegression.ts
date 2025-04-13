// Helper function to calculate 3x3 determinant
const determinant3x3 = (matrix: number[][]) => {
  return (
    matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
    matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
    matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0])
  );
};

export const calculatePolynomialRegression = (
  data: { x: number; y: number }[],
  degree: number = 2
) => {
  const n = data.length;

  // Compute sums for matrix elements
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumXXX = 0;
  let sumXXXX = 0;
  let sumXY = 0;
  let sumXXY = 0;

  for (let i = 0; i < n; i++) {
    const { x, y } = data[i];
    const xx = x * x;
    const xxx = xx * x;
    const xxxx = xx * xx;

    sumX += x;
    sumY += y;
    sumXX += xx;
    sumXXX += xxx;
    sumXXXX += xxxx;
    sumXY += x * y;
    sumXXY += xx * y;
  }

  let a: number, b: number, c: number;

  if (degree === 1) {
    // Linear regression: y = ax + b
    const denominator = n * sumXX - sumX * sumX;
    a = (n * sumXY - sumX * sumY) / denominator;
    b = (sumY * sumXX - sumX * sumXY) / denominator;
    c = 0;

    return {
      coefficients: [b, a],
      equation: `y = ${b.toFixed(3)} + ${a.toFixed(3)}x`,
      predict: (x: number) => a * x + b,
      type: 'linear'
    };
  } else {
    // Quadratic regression: y = ax² + bx + c
    const matrix = [
      [n, sumX, sumXX],
      [sumX, sumXX, sumXXX],
      [sumXX, sumXXX, sumXXXX]
    ];

    const vector = [sumY, sumXY, sumXXY];

    // Solve system of equations using Cramer's rule
    const D = determinant3x3(matrix);

    const matrix1 = [
      [vector[0], matrix[0][1], matrix[0][2]],
      [vector[1], matrix[1][1], matrix[1][2]],
      [vector[2], matrix[2][1], matrix[2][2]]
    ];

    const matrix2 = [
      [matrix[0][0], vector[0], matrix[0][2]],
      [matrix[1][0], vector[1], matrix[1][2]],
      [matrix[2][0], vector[2], matrix[2][2]]
    ];

    const matrix3 = [
      [matrix[0][0], matrix[0][1], vector[0]],
      [matrix[1][0], matrix[1][1], vector[1]],
      [matrix[2][0], matrix[2][1], vector[2]]
    ];

    c = determinant3x3(matrix1) / D;
    b = determinant3x3(matrix2) / D;
    a = determinant3x3(matrix3) / D;

    const predict = (x: number) => {
      return a * x * x + b * x + c;
    };

    const slopeData: number[] = data.map((item) => {
      return predict(item.x);
    });

    return {
      coefficients: [c, b, a],
      equation: `y = ${a.toFixed(3)}x² + ${b.toFixed(3)}x + ${c.toFixed(3)}`,
      predict,
      type: 'quadratic',
      slopeData: slopeData
    };
  }
};
