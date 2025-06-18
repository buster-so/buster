import type {
  DashboardYml,
  MetricYml,
  Version,
  VersionContent,
  VersionHistory,
} from './version-history-types';
import { dashboardYmlSchema, metricYmlSchema } from './version-history-types';

/**
 * Creates a version entry for a metric
 */
export function createMetricVersion(
  metricYml: MetricYml,
  versionNumber: number,
  timestamp?: string
): Version {
  return {
    version_number: versionNumber,
    updated_at: timestamp || new Date().toISOString(),
    content: { MetricYml: metricYml },
  };
}

/**
 * Creates a version entry for a dashboard
 */
export function createDashboardVersion(
  dashboardYml: DashboardYml,
  versionNumber: number,
  timestamp?: string
): Version {
  return {
    version_number: versionNumber,
    updated_at: timestamp || new Date().toISOString(),
    content: { DashboardYml: dashboardYml },
  };
}

/**
 * Creates an initial version history for a metric (version 1)
 */
export function createInitialMetricVersionHistory(
  metricYml: MetricYml,
  timestamp?: string
): VersionHistory {
  return {
    '1': createMetricVersion(metricYml, 1, timestamp),
  };
}

/**
 * Creates an initial version history for a dashboard (version 1)
 */
export function createInitialDashboardVersionHistory(
  dashboardYml: DashboardYml,
  timestamp?: string
): VersionHistory {
  return {
    '1': createDashboardVersion(dashboardYml, 1, timestamp),
  };
}

/**
 * Adds a new metric version to existing version history
 */
export function addMetricVersionToHistory(
  history: VersionHistory | null | undefined,
  metricYml: MetricYml,
  timestamp?: string
): VersionHistory {
  // If no history exists, create initial version
  if (!history || Object.keys(history).length === 0) {
    return createInitialMetricVersionHistory(metricYml, timestamp);
  }

  // Find the highest version number
  const versionNumbers = Object.keys(history)
    .map((key) => Number.parseInt(key, 10))
    .filter((num) => !Number.isNaN(num));

  const nextVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;

  return {
    ...history,
    [nextVersion.toString()]: createMetricVersion(metricYml, nextVersion, timestamp),
  };
}

/**
 * Adds a new dashboard version to existing version history
 */
export function addDashboardVersionToHistory(
  history: VersionHistory | null | undefined,
  dashboardYml: DashboardYml,
  timestamp?: string
): VersionHistory {
  // If no history exists, create initial version
  if (!history || Object.keys(history).length === 0) {
    return createInitialDashboardVersionHistory(dashboardYml, timestamp);
  }

  // Find the highest version number
  const versionNumbers = Object.keys(history)
    .map((key) => Number.parseInt(key, 10))
    .filter((num) => !Number.isNaN(num));

  const nextVersion = versionNumbers.length > 0 ? Math.max(...versionNumbers) + 1 : 1;

  return {
    ...history,
    [nextVersion.toString()]: createDashboardVersion(dashboardYml, nextVersion, timestamp),
  };
}

/**
 * Gets the latest version number from a version history
 */
export function getLatestVersionNumber(history: VersionHistory | null | undefined): number {
  if (!history || Object.keys(history).length === 0) {
    return 0;
  }

  const versionNumbers = Object.keys(history)
    .map((key) => Number.parseInt(key, 10))
    .filter((num) => !Number.isNaN(num));

  return versionNumbers.length > 0 ? Math.max(...versionNumbers) : 0;
}

/**
 * Gets the latest version entry from version history
 */
export function getLatestVersion(history: VersionHistory | null | undefined): Version | null {
  const latestVersionNumber = getLatestVersionNumber(history);
  if (latestVersionNumber === 0 || !history) {
    return null;
  }

  return history[latestVersionNumber.toString()] || null;
}

/**
 * Gets a specific version by version number
 */
export function getVersion(
  history: VersionHistory | null | undefined,
  versionNumber: number
): Version | null {
  if (!history) {
    return null;
  }

  return history[versionNumber.toString()] || null;
}

/**
 * Validates a MetricYml object matches the expected schema
 */
export function validateMetricYml(metricYml: unknown): MetricYml {
  return metricYmlSchema.parse(metricYml);
}

/**
 * Validates a DashboardYml object matches the expected schema
 */
export function validateDashboardYml(dashboardYml: unknown): DashboardYml {
  return dashboardYmlSchema.parse(dashboardYml);
}

/**
 * Updates the latest version without creating a new version
 * Matches Rust VersionHistory.update_latest_version behavior
 */
export function updateLatestVersion(
  history: VersionHistory | null | undefined,
  content: VersionContent,
  timestamp?: string
): VersionHistory {
  if (!history || Object.keys(history).length === 0) {
    // If there are no versions yet, create version 1
    return {
      '1': {
        version_number: 1,
        updated_at: timestamp || new Date().toISOString(),
        content,
      },
    };
  }

  // Get the latest version and update its content
  const latestVersionNumber = getLatestVersionNumber(history);
  return {
    ...history,
    [latestVersionNumber.toString()]: {
      version_number: latestVersionNumber,
      updated_at: timestamp || new Date().toISOString(),
      content,
    },
  };
}

/**
 * Creates a new VersionHistory with initial content (matches Rust VersionHistory::new)
 */
export function createVersionHistory(
  versionNumber: number,
  content: VersionContent,
  timestamp?: string
): VersionHistory {
  return {
    [versionNumber.toString()]: {
      version_number: versionNumber,
      updated_at: timestamp || new Date().toISOString(),
      content,
    },
  };
}

/**
 * Adds a version to existing history (matches Rust VersionHistory::add_version)
 */
export function addVersionToHistory(
  history: VersionHistory,
  versionNumber: number,
  content: VersionContent,
  timestamp?: string
): VersionHistory {
  return {
    ...history,
    [versionNumber.toString()]: {
      version_number: versionNumber,
      updated_at: timestamp || new Date().toISOString(),
      content,
    },
  };
}
