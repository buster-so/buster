import { checkPermission } from '@buster/access-controls';
import {
  type MetricFile,
  type User,
  getAssetsAssociatedWithMetric,
  getMetricFileById,
  getOrganizationMemberCount,
  getUsersWithAssetPermissions,
} from '@buster/database/queries';
import {
  type ChartConfigProps,
  DEFAULT_CHART_THEME,
  type DataMetadata,
  type GetMetricResponse,
  type Metric,
  type MetricWithFilters,
  type MetricYml,
} from '@buster/server-shared/metrics';
import type { AssetPermissionRole, VerificationStatus } from '@buster/server-shared/share';
import { HTTPException } from 'hono/http-exception';
import yaml from 'js-yaml';
import { z } from 'zod';
import { throwUnauthorizedError } from './asset-public-access';
import { getPubliclyEnabledByUser } from './get-publicly-enabled-by-user';

export const MetricAccessOptionsSchema = z.object({
  /** If public access has been verified by a parent resource set to true */
  publicAccessPreviouslyVerified: z.boolean().default(false),
  /** Password for public access validation */
  password: z.string().optional(),
  /** Version number to fetch */
  versionNumber: z.number().int().optional(),
});

export type MetricAccessOptions = z.infer<typeof MetricAccessOptionsSchema>;

export interface ProcessedMetricData {
  metricFile: MetricFile;
  resolvedContent: MetricYml;
  resolvedName: string;
  resolvedDescription: string | null;
  resolvedTimeFrame: string;
  resolvedChartConfig: ChartConfigProps;
  resolvedSql: string;
  resolvedUpdatedAt: string;
  resolvedVersionNum: number;
  effectiveRole: AssetPermissionRole;
  versions: Array<{ version_number: number; updated_at: string }>;
}

/**
 * Shared helper function to fetch and process metric data with flexible access control
 */
export async function fetchAndProcessMetricData(
  metricId: string,
  user: User,
  options: MetricAccessOptions
): Promise<ProcessedMetricData> {
  const { publicAccessPreviouslyVerified = false, password, versionNumber } = options;

  // Fetch metric details
  const metricFile = await getMetricFileById(metricId);

  if (!metricFile) {
    console.warn(`Metric file not found: ${metricId}`);
    throw new HTTPException(404, {
      message: 'Metric file not found',
    });
  }

  let effectiveRole: AssetPermissionRole | undefined = publicAccessPreviouslyVerified
    ? 'can_view'
    : undefined;

  const permissionResult = await checkPermission({
    userId: user.id,
    assetId: metricId,
    assetType: 'metric_file',
    requiredRole: 'can_view',
    organizationId: metricFile.organizationId,
    workspaceSharing: metricFile.workspaceSharing || 'none',
    publiclyAccessible: metricFile.publiclyAccessible ?? false,
    publicExpiryDate: metricFile.publicExpiryDate ?? undefined,
    publicPassword: metricFile.publicPassword ?? undefined,
    userSuppliedPassword: password,
  });

  effectiveRole = permissionResult.effectiveRole ? permissionResult.effectiveRole : effectiveRole;

  if (!permissionResult.hasAccess || !effectiveRole) {
    throwUnauthorizedError({
      publiclyAccessible: metricFile.publiclyAccessible ?? false,
      publicExpiryDate: metricFile.publicExpiryDate ?? undefined,
      publicPassword: metricFile.publicPassword ?? undefined,
      userSuppliedPassword: password,
    });
  }

  // Parse version history
  const versionHistory = metricFile.versionHistory;
  const versions: Array<{ version_number: number; updated_at: string }> = [];

  Object.values(versionHistory).forEach((version) => {
    //@ts-expect-error - versionNumber is sometimes camelCase due to v1 endpoint
    const v = version as {
      version_number: number;
      versionNumber: number;
      updated_at: string;
      updatedAt: string;
    };
    const versionNumber: number = v.version_number ? v.version_number : v.versionNumber;
    const updatedAt: string = v.updated_at ? v.updated_at : v.updatedAt;
    versions.push({
      version_number: versionNumber,
      updated_at: updatedAt,
    });
  });
  versions.sort((a, b) => a.version_number - b.version_number);

  // Resolve version-specific data
  let resolvedContent: MetricYml;
  let resolvedName: string;
  let resolvedDescription: string | null;
  let resolvedTimeFrame: string;
  let resolvedChartConfig: ChartConfigProps;
  let resolvedSql: string;
  let resolvedUpdatedAt: string;
  let resolvedVersionNum: number;

  // Get requested version if included in the request
  if (versionNumber) {
    const requestedVersionNumToString = versionNumber.toString();

    if (versionHistory[requestedVersionNumToString]) {
      const version = versionHistory[requestedVersionNumToString];

      if (!version || !version.content) {
        throw new HTTPException(404, {
          message: `Version ${versionNumber} not found`,
        });
      }

      const versionContent = version.content as MetricYml;
      resolvedContent = versionContent;
      resolvedName = versionContent.name;
      resolvedDescription = versionContent.description;
      resolvedTimeFrame = versionContent.timeFrame;
      resolvedChartConfig = versionContent.chartConfig;
      resolvedSql = versionContent.sql;
      resolvedUpdatedAt = version.updated_at;
      resolvedVersionNum = version.version_number;
    } else {
      throw new HTTPException(404, {
        message: `Version ${versionNumber} not found`,
      });
    }
  } else {
    // Use current/latest version
    const currentContent = metricFile.content as MetricYml;
    resolvedContent = currentContent;
    resolvedName = metricFile.name;
    resolvedDescription = currentContent.description;
    resolvedTimeFrame = currentContent.timeFrame;
    resolvedChartConfig = currentContent.chartConfig;
    resolvedSql = currentContent.sql;
    resolvedUpdatedAt = metricFile.updatedAt;

    // Determine latest version number
    const maxVersion = Math.max(...versions.map((v) => v.version_number), 1);
    resolvedVersionNum = maxVersion;
  }

  // Color fallback from v1 api logic
  if (!resolvedChartConfig.colors) {
    resolvedChartConfig.colors = DEFAULT_CHART_THEME;
  }

  return {
    metricFile,
    resolvedContent,
    resolvedName,
    resolvedDescription,
    resolvedTimeFrame,
    resolvedChartConfig,
    resolvedSql,
    resolvedUpdatedAt,
    resolvedVersionNum,
    effectiveRole,
    versions,
  };
}

/**
 * Build a complete metric response from processed metric data
 */
export async function buildMetricResponse(
  processedData: ProcessedMetricData,
  userId: string
): Promise<GetMetricResponse> {
  const {
    metricFile,
    resolvedContent,
    resolvedName,
    resolvedDescription,
    resolvedTimeFrame,
    resolvedChartConfig,
    resolvedSql,
    resolvedUpdatedAt,
    resolvedVersionNum,
    effectiveRole,
    versions,
  } = processedData;

  const fileYaml = yaml.dump(resolvedContent);

  // Get the extra metric info concurrently
  const [individualPermissions, workspaceMemberCount, associatedAssets, publicEnabledBy] =
    await Promise.all([
      getUsersWithAssetPermissions({ assetId: metricFile.id, assetType: 'metric_file' }),
      getOrganizationMemberCount(metricFile.organizationId),
      getAssetsAssociatedWithMetric(metricFile.id, userId),
      getPubliclyEnabledByUser(metricFile.publiclyEnabledBy),
    ]);

  const { dashboards, collections } = associatedAssets;

  // Not used but still exists in frontend code so including it here
  const evaluationScore = (() => {
    if (!metricFile.evaluationScore) {
      return 'Low';
    }
    if (metricFile.evaluationScore > 0.8) {
      return 'High';
    }
    if (metricFile.evaluationScore > 0.5) {
      return 'Moderate';
    }
    return 'Low';
  })() as 'High' | 'Moderate' | 'Low';

  // Build the response
  const response: GetMetricResponse = {
    id: metricFile.id,
    type: 'metric_file',
    name: resolvedName,
    version_number: resolvedVersionNum,
    error: null,
    description: resolvedDescription,
    file_name: metricFile.fileName,
    time_frame: resolvedTimeFrame,
    data_source_id: metricFile.dataSourceId,
    chart_config: resolvedChartConfig,
    data_metadata: metricFile.dataMetadata as DataMetadata,
    status: metricFile.verification as VerificationStatus,
    file: fileYaml,
    created_at: metricFile.createdAt,
    updated_at: resolvedUpdatedAt,
    sent_by_id: metricFile.createdBy,
    sent_by_name: '',
    sent_by_avatar_url: null,
    sql: resolvedSql,
    dashboards,
    collections,
    versions,
    evaluation_score: evaluationScore,
    evaluation_summary: metricFile.evaluationSummary || '',
    permission: effectiveRole,
    individual_permissions: individualPermissions,
    publicly_accessible: metricFile.publiclyAccessible,
    public_expiry_date: metricFile.publicExpiryDate,
    public_enabled_by: publicEnabledBy,
    public_password: metricFile.publicPassword,
    workspace_sharing: metricFile.workspaceSharing,
    workspace_member_count: workspaceMemberCount,
    filters: resolvedContent.filters,
  };

  return response;
}

export async function getMetricsInAncestorAssetFromMetricIds(
  metricIds: string[],
  user: User
): Promise<Record<string, MetricWithFilters>> {
  const metricsObj: Record<string, MetricWithFilters> = {};

  // Process metrics in chunks of 4 to manage concurrency
  const results = [];
  const chunkSize = 4;

  for (let i = 0; i < metricIds.length; i += chunkSize) {
    const chunk = metricIds.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (metricId) => {
      const processedData = await fetchAndProcessMetricData(metricId, user, {
        publicAccessPreviouslyVerified: true, // Access is inherited from dashboard access at a minimum
      });

      // Build the metric response
      const metric = await buildMetricResponse(processedData, user.id);
      return { metricId, metric };
    });

    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  // Filter out failed metrics and build the response object
  for (const result of results) {
    if (result) {
      metricsObj[result.metricId] = result.metric;
    }
  }

  return metricsObj;
}
