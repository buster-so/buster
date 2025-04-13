import { createDayjsDate } from '../date';

export const calculateLinearSlopeByDate = (data: number[], dates: string[]) => {
  const n = data.length;

  // Convert dates to timestamps (milliseconds since epoch)
  const timestamps = dates.map((date) => createDayjsDate(date).valueOf());

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    sumX += timestamps[i];
    sumY += data[i];
    sumXY += timestamps[i] * data[i];
    sumXX += timestamps[i] * timestamps[i];
  }

  // Calculate slope and intercept
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate predicted values for each date point
  const slopeData = timestamps.map((timestamp) => slope * timestamp + intercept);

  // Convert to more readable "change per day" rate
  const changePerDay = slope * (24 * 60 * 60 * 1000); // milliseconds in a day

  return {
    slope,
    slopeData,
    intercept,
    changePerDay,
    equation: `y = ${slope.toExponential(2)}x + ${intercept.toFixed(1)}`,
    predict: (date: string) => {
      const timestamp = createDayjsDate(date).valueOf();
      return slope * timestamp + intercept;
    }
  };
};
