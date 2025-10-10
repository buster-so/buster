import pluralize from 'pluralize';

/**
 * Format elapsed time for display in secondary_title
 * @param startTime - The start time as milliseconds (from Date.now()) or Date object
 * @param endTime - The end time as milliseconds (from Date.now()) or Date object, defaults to current time
 * @param options.includeDecimals - Whether to include decimals in seconds display (default: true)
 * @returns Formatted string like "4.9 seconds" or "2 minutes"
 */
export function formatElapsedTime(
  //We should consider just using a Date to avoid weird side effects... Next dev to look at this should do it.
  // I did not do it because workFlowStartTime is consumed in a lot of places...
  startTime?: number | Date,
  endTime?: number | Date,
  options?: { includeDecimals?: boolean }
): string | undefined {
  if (!startTime) {
    return undefined;
  }

  const start = typeof startTime === 'number' ? startTime : startTime.getTime();
  const end = endTime ? (typeof endTime === 'number' ? endTime : endTime.getTime()) : Date.now();
  const elapsedMs = end - start;
  const elapsedSeconds = elapsedMs / 1000;
  const includeDecimals = options?.includeDecimals ?? true;

  if (elapsedSeconds < 60) {
    // For seconds, show one decimal place by default, or whole seconds if includeDecimals is false
    const secondsValue = includeDecimals
      ? Number.parseFloat(elapsedSeconds.toFixed(1))
      : Math.floor(elapsedSeconds);
    return `${includeDecimals ? secondsValue.toFixed(1) : secondsValue} ${pluralize('second', secondsValue)}`;
  }

  // For minutes, show whole minutes only
  const minutes = Math.floor(elapsedSeconds / 60);
  return `${minutes} ${pluralize('minute', minutes)}`;
}
