import type {
  DashboardContent,
  DashboardVersionEntry,
  DashboardVersionHistory,
  MetricContent,
  MetricVersionEntry,
  MetricVersionHistory,
} from './version-history-types';
import { metricContentSchema } from './version-history-types';

/**
 * Creates a version entry for a metric
 */
export function createMetricVersionEntry(
  content: MetricContent,
  versionNumber: number,
  timestamp?: string
): MetricVersionEntry {
  return {
    content,
    updated_at: timestamp || new Date().toISOString(),
    version_number: versionNumber,
  };
}

/**
 * Creates a version entry for a dashboard
 */
export function createDashboardVersionEntry(
  content: DashboardContent,
  versionNumber: number,
  timestamp?: string
): DashboardVersionEntry {
  return {
    content,
    updated_at: timestamp || new Date().toISOString(),
    version_number: versionNumber,
  };
}

/**
 * Creates an initial version history for a metric (version 1)
 */
export function createInitialMetricVersionHistory(
  content: MetricContent,
  timestamp?: string
): MetricVersionHistory {
  return {
    '1': createMetricVersionEntry(content, 1, timestamp),
  };
}

/**
 * Creates an initial version history for a dashboard (version 1)
 */
export function createInitialDashboardVersionHistory(
  content: DashboardContent,
  timestamp?: string
): DashboardVersionHistory {
  return {
    '1': createDashboardVersionEntry(content, 1, timestamp),
  };
}

/**
 * Adds a new version to an existing metric version history
 */
export function addMetricVersionToHistory(
  history: MetricVersionHistory | null | undefined,
  content: MetricContent,
  timestamp?: string
): MetricVersionHistory {
  // If no history exists, create initial version
  if (!history || Object.keys(history).length === 0) {
    return createInitialMetricVersionHistory(content, timestamp);
  }

  // Find the highest version number
  const versionNumbers = Object.keys(history)
    .map((key) => Number.parseInt(key, 10))
    .filter((num) => !Number.isNaN(num));

  const nextVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;

  return {
    ...history,
    [nextVersion.toString()]: createMetricVersionEntry(content, nextVersion, timestamp),
  };
}

/**
 * Adds a new version to an existing dashboard version history
 */
export function addDashboardVersionToHistory(
  history: DashboardVersionHistory | null | undefined,
  content: DashboardContent,
  timestamp?: string
): DashboardVersionHistory {
  // If no history exists, create initial version
  if (!history || Object.keys(history).length === 0) {
    return createInitialDashboardVersionHistory(content, timestamp);
  }

  // Find the highest version number
  const versionNumbers = Object.keys(history)
    .map((key) => Number.parseInt(key, 10))
    .filter((num) => !Number.isNaN(num));

  const nextVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;

  return {
    ...history,
    [nextVersion.toString()]: createDashboardVersionEntry(content, nextVersion, timestamp),
  };
}

/**
 * Gets the latest version number from a version history
 */
export function getLatestVersionNumber(
  history: MetricVersionHistory | DashboardVersionHistory | null | undefined
): number {
  if (!history || Object.keys(history).length === 0) {
    return 0;
  }

  const versionNumbers = Object.keys(history)
    .map((key) => Number.parseInt(key, 10))
    .filter((num) => !Number.isNaN(num));

  return versionNumbers.length > 0 ? Math.max(...versionNumbers) : 0;
}

/**
 * Gets the latest version entry from a metric version history
 */
export function getLatestMetricVersion(
  history: MetricVersionHistory | null | undefined
): MetricVersionEntry | null {
  const latestVersionNumber = getLatestVersionNumber(history);
  if (latestVersionNumber === 0 || !history) {
    return null;
  }

  return history[latestVersionNumber.toString()] || null;
}

/**
 * Gets the latest version entry from a dashboard version history
 */
export function getLatestDashboardVersion(
  history: DashboardVersionHistory | null | undefined
): DashboardVersionEntry | null {
  const latestVersionNumber = getLatestVersionNumber(history);
  if (latestVersionNumber === 0 || !history) {
    return null;
  }

  return history[latestVersionNumber.toString()] || null;
}

/**
 * Converts a metric content object to the format needed for version history
 */
export function metricYmlToVersionContent(metricYml: {
  name: string;
  description?: string;
  timeFrame: string;
  sql: string;
  chartConfig: MetricContent['chartConfig'];
}): MetricContent {
  // Validate the complete metric content to ensure type safety
  const validatedContent = metricContentSchema.parse({
    sql: metricYml.sql,
    name: metricYml.name,
    timeFrame: metricYml.timeFrame,
    chartConfig: metricYml.chartConfig,
    description: metricYml.description || '',
  });

  return validatedContent;
}

/**
 * Converts a dashboard content object to the format needed for version history
 */
export function dashboardYmlToVersionContent(dashboardYml: {
  name: string;
  description?: string;
  rows: Array<{
    id: number;
    items: Array<{ id: string }>;
    columnSizes: number[];
  }>;
}): DashboardContent {
  return {
    name: dashboardYml.name,
    rows: dashboardYml.rows,
    description: dashboardYml.description || '',
  };
}
