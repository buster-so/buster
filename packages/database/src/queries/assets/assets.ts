import { and, eq, inArray, isNull } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../../connection';
import { dashboardFiles, messages, messagesToFiles, metricFiles, reportFiles } from '../../schema';

// Type inference from schema
type Message = InferSelectModel<typeof messages>;

const DatabaseAssetTypeSchema = z.enum(['metric_file', 'dashboard_file', 'report_file']);
export type DatabaseAssetType = z.infer<typeof DatabaseAssetTypeSchema>;

/**
 * Input schemas
 */
export const GenerateAssetMessagesInputSchema = z.object({
  assetId: z.string().uuid(),
  assetType: DatabaseAssetTypeSchema,
  userId: z.string().uuid(),
  chatId: z.string().uuid(),
});

export type GenerateAssetMessagesInput = z.infer<typeof GenerateAssetMessagesInputSchema>;

/**
 * Asset details type
 */
interface AssetDetails {
  id: string;
  name: string;
  //TODO: Dallin let's make a type for this. It should not just be a jsonb object.
  content?: unknown;
  createdBy: string;
}

/**
 * Dashboard content schema for parsing
 */
const DashboardContentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  rows: z.array(
    z.object({
      id: z.number(),
      items: z.array(
        z.object({
          id: z.string().uuid(),
        })
      ),
      columnSizes: z.array(z.number()),
    })
  ),
});

/**
 * Extract metric IDs from dashboard content
 */
function extractMetricIds(content: unknown): string[] {
  try {
    const parsedContent = DashboardContentSchema.parse(content);
    const metricIds = parsedContent.rows.flatMap((row) => row.items.map((item) => item.id));
    return [...new Set(metricIds)];
  } catch {
    return [];
  }
}

/**
 * Get asset details based on type
 */
async function getAssetDetails(
  assetId: string,
  assetType: DatabaseAssetType
): Promise<AssetDetails | null> {
  if (assetType === 'metric_file') {
    const [metric] = await db
      .select({
        id: metricFiles.id,
        name: metricFiles.name,
        content: metricFiles.content,
        createdBy: metricFiles.createdBy,
      })
      .from(metricFiles)
      .where(and(eq(metricFiles.id, assetId), isNull(metricFiles.deletedAt)))
      .limit(1);

    return metric || null;
  }
  if (assetType === 'dashboard_file') {
    const [dashboard] = await db
      .select({
        id: dashboardFiles.id,
        name: dashboardFiles.name,
        content: dashboardFiles.content,
        createdBy: dashboardFiles.createdBy,
      })
      .from(dashboardFiles)
      .where(and(eq(dashboardFiles.id, assetId), isNull(dashboardFiles.deletedAt)))
      .limit(1);

    return dashboard || null;
  }

  if (assetType === 'report_file') {
    const [report] = await db
      .select({
        id: reportFiles.id,
        name: reportFiles.name,
        content: reportFiles.content,
        createdBy: reportFiles.createdBy,
      })
      .from(reportFiles)
      .where(and(eq(reportFiles.id, assetId), isNull(reportFiles.deletedAt)))
      .limit(1);

    return report || null;
  }

  const _exhaustiveCheck: never = assetType;

  return null;
}

/**
 * Generate initial messages for an asset-based chat
 * This matches the Rust implementation exactly
 */
export async function generateAssetMessages(input: GenerateAssetMessagesInput): Promise<Message[]> {
  const validated = GenerateAssetMessagesInputSchema.parse(input);

  // Get asset details
  const asset = await getAssetDetails(validated.assetId, validated.assetType);
  if (!asset) {
    throw new Error(`Asset not found: ${validated.assetId}`);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const assetTypeStr =
    validated.assetType === 'metric_file'
      ? 'metric'
      : validated.assetType === 'dashboard_file'
        ? 'dashboard'
        : 'report';

  // Prepare asset data and fetch additional context files for dashboards
  interface AssetFileData {
    id: string;
    name: string;
    file_type: string;
    asset_type: string;
    yml_content: string;
    created_at: string;
    version_number: number;
    updated_at: string;
  }

  let additionalFiles: AssetFileData[] = [];
  let messageText = `Successfully imported 1 ${assetTypeStr} file.`;

  const assetData = {
    id: validated.assetId,
    name: asset.name,
    file_type: assetTypeStr,
    asset_type: assetTypeStr,
    yml_content: JSON.stringify(asset.content), // Using JSON since we don't have YAML serializer
    created_at: new Date().toISOString(),
    version_number: 1,
    updated_at: new Date().toISOString(),
  };

  // If it's a dashboard, fetch associated metrics
  if (validated.assetType === 'dashboard_file') {
    const metricIds = extractMetricIds(asset.content);

    if (metricIds.length > 0) {
      // Fetch all metrics associated with the dashboard
      const metrics = await db
        .select({
          id: metricFiles.id,
          name: metricFiles.name,
          content: metricFiles.content,
          createdBy: metricFiles.createdBy,
          createdAt: metricFiles.createdAt,
          updatedAt: metricFiles.updatedAt,
        })
        .from(metricFiles)
        .where(and(inArray(metricFiles.id, metricIds), isNull(metricFiles.deletedAt)));

      // Format metric data for inclusion
      additionalFiles = metrics.map((metric) => ({
        id: metric.id,
        name: metric.name,
        file_type: 'metric',
        asset_type: 'metric',
        yml_content: JSON.stringify(metric.content),
        created_at: metric.createdAt,
        version_number: 1,
        updated_at: metric.updatedAt,
      }));

      messageText = `Successfully imported 1 dashboard file with ${additionalFiles.length} additional context files.`;
    }
  }

  // Create combined file list with the main asset first, followed by context files
  const allFiles = [assetData, ...additionalFiles];

  // Create the user message with imported asset information (matching Rust)
  const userMessageForAgent = {
    role: 'user',
    content: `I've imported the following ${assetTypeStr}:\n\n${messageText}\n\nFile details:\n${JSON.stringify(allFiles, null, 2)}`,
  };

  const rawLlmMessages = [userMessageForAgent];

  // Generate IDs for the response messages
  const textMessageId = crypto.randomUUID();
  const fileMessageId = validated.assetId; // Use the asset ID as the file message ID

  // Create response messages as an array (matching Rust format)
  const responseMessages = [
    {
      type: 'text',
      id: textMessageId,
      message: `${asset.name} has been pulled into a new chat.\n\nContinue chatting to modify or make changes to it.`,
      is_final_message: true,
    },
    {
      type: 'file',
      id: fileMessageId,
      file_type: assetTypeStr,
      file_name: asset.name,
      version_number: 1,
      filter_version_id: null,
      metadata: [
        {
          status: 'completed',
          message: 'Pulled into new chat',
          timestamp: timestamp,
        },
      ],
    },
  ];

  // Create the message with no request_message (matching Rust)
  const [message] = await db
    .insert(messages)
    .values({
      chatId: validated.chatId,
      createdBy: validated.userId,
      requestMessage: null, // No request message, matching Rust
      responseMessages: responseMessages, // Use array format
      reasoning: [],
      finalReasoningMessage: '',
      title: asset.name,
      rawLlmMessages: rawLlmMessages,
      isCompleted: true,
    })
    .returning();

  if (message) {
    // Create file association for the message
    await createMessageFileAssociation({
      messageId: message.id,
      fileId: validated.assetId,
      fileType: validated.assetType,
      version: 1,
    });

    return [message];
  }

  return [];
}

/**
 * Create a message-to-file association
 */
interface CreateFileAssociationInput {
  messageId: string;
  fileId: string;
  fileType: DatabaseAssetType;
  version: number;
}

export async function createMessageFileAssociation(
  input: CreateFileAssociationInput
): Promise<void> {
  await db.insert(messagesToFiles).values({
    id: crypto.randomUUID(),
    messageId: input.messageId,
    fileId: input.fileId,
    versionNumber: input.version,
    isDuplicate: false,
  });
}

/**
 * Get asset details by ID and type (for TypeScript server)
 */
export const GetAssetDetailsInputSchema = z.object({
  assetId: z.string().uuid(),
  assetType: DatabaseAssetTypeSchema,
});

export type GetAssetDetailsInput = z.infer<typeof GetAssetDetailsInputSchema>;

export interface AssetDetailsResult {
  id: string;
  name: string;
  content: unknown;
  versionNumber: number;
  createdBy: string;
}

export async function getAssetDetailsById(
  input: GetAssetDetailsInput
): Promise<AssetDetailsResult | null> {
  const validated = GetAssetDetailsInputSchema.parse(input);

  if (validated.assetType === 'metric_file') {
    const [metric] = await db
      .select({
        id: metricFiles.id,
        name: metricFiles.name,
        content: metricFiles.content,
        versionHistory: metricFiles.versionHistory,
        createdBy: metricFiles.createdBy,
      })
      .from(metricFiles)
      .where(and(eq(metricFiles.id, validated.assetId), isNull(metricFiles.deletedAt)))
      .limit(1);

    if (!metric) return null;

    // Extract version number from version history
    // versionHistory is a Record<string, {content, updated_at, version_number}>
    // Get the highest version number from the keys
    const versionNumber = (() => {
      if (!metric.versionHistory || typeof metric.versionHistory !== 'object') {
        return 1;
      }

      const versionKeys = Object.keys(metric.versionHistory);
      if (versionKeys.length === 0) {
        return 1;
      }

      // Parse version keys and find the highest
      const versions = versionKeys
        .map((key) => Number.parseInt(key, 10))
        .filter((v) => !Number.isNaN(v));
      return versions.length > 0 ? Math.max(...versions) : 1;
    })();

    return {
      id: metric.id,
      name: metric.name,
      content: metric.content,
      versionNumber,
      createdBy: metric.createdBy,
    };
  }

  if (validated.assetType === 'dashboard_file') {
    const [dashboard] = await db
      .select({
        id: dashboardFiles.id,
        name: dashboardFiles.name,
        content: dashboardFiles.content,
        versionHistory: dashboardFiles.versionHistory,
        createdBy: dashboardFiles.createdBy,
      })
      .from(dashboardFiles)
      .where(and(eq(dashboardFiles.id, validated.assetId), isNull(dashboardFiles.deletedAt)))
      .limit(1);

    if (!dashboard) return null;

    // Extract version number from version history
    // versionHistory is a Record<string, {content, updated_at, version_number}>
    // Get the highest version number from the keys
    const versionNumber = (() => {
      if (!dashboard.versionHistory || typeof dashboard.versionHistory !== 'object') {
        return 1;
      }

      const versionKeys = Object.keys(dashboard.versionHistory);
      if (versionKeys.length === 0) {
        return 1;
      }

      // Parse version keys and find the highest
      const versions = versionKeys
        .map((key) => Number.parseInt(key, 10))
        .filter((v) => !Number.isNaN(v));
      return versions.length > 0 ? Math.max(...versions) : 1;
    })();

    return {
      id: dashboard.id,
      name: dashboard.name,
      content: dashboard.content,
      versionNumber,
      createdBy: dashboard.createdBy,
    };
  }

  if (validated.assetType === 'report_file') {
    const [report] = await db
      .select({
        id: reportFiles.id,
        name: reportFiles.name,
        content: reportFiles.content,
        versionHistory: reportFiles.versionHistory,
        createdBy: reportFiles.createdBy,
      })
      .from(reportFiles)
      .where(and(eq(reportFiles.id, validated.assetId), isNull(reportFiles.deletedAt)))
      .limit(1);

    if (!report) return null;

    // Extract version number from version history
    // versionHistory is a Record<string, {content, updated_at, version_number}>
    // Get the highest version number from the keys
    const versionNumber = (() => {
      if (!report.versionHistory || typeof report.versionHistory !== 'object') {
        return 1;
      }

      const versionKeys = Object.keys(report.versionHistory);
      if (versionKeys.length === 0) {
        return 1;
      }

      // Parse version keys and find the highest
      const versions = versionKeys
        .map((key) => Number.parseInt(key, 10))
        .filter((v) => !Number.isNaN(v));
      return versions.length > 0 ? Math.max(...versions) : 1;
    })();

    return {
      id: report.id,
      name: report.name,
      content: report.content,
      versionNumber,
      createdBy: report.createdBy,
    };
  }

  // Exhaustive check
  const _exhaustiveCheck: never = validated.assetType;
  return null;
}
