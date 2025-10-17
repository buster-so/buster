import type { UpdateMessageEntriesParams } from '@buster/database/queries';
import * as databaseQueries from '@buster/database/queries';
import {
  type ResponseMessageFileType,
  ResponseMessageFileTypeSchema,
} from '@buster/database/schema-types';
import type { ToolCallOptions } from 'ai';
import {
  getOptimisticValue,
  OptimisticJsonParser,
} from '../../../utils/streaming/optimistic-json-parser';
import { formatElapsedTime } from '../../shared/format-elapsed-time';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';
import {
  createDoneToolRawLlmMessageEntry,
  createDoneToolResponseMessage,
} from './helpers/done-tool-transform-helper';

// Type-safe key extraction from the schema - will cause compile error if field name changes
// Using keyof with the inferred type ensures we're using the actual schema keys
const FINAL_RESPONSE_KEY = 'finalResponse' as const satisfies keyof DoneToolInput;
const ASSETS_TO_RETURN_KEY = 'assetsToReturn' as const satisfies keyof DoneToolInput;

export function createDoneToolDelta(context: DoneToolContext, doneToolState: DoneToolState) {
  const { getAssetLatestVersion, updateChat, updateMessage, updateMessageEntries } =
    databaseQueries;

  const isMessageUpdateQueueClosed = databaseQueries.isMessageUpdateQueueClosed ?? (() => false);

  return async function doneToolDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
    if (doneToolState.isFinalizing || isMessageUpdateQueueClosed(context.messageId)) {
      return;
    }

    const recordSequence = (sequenceNumber: number, skipped?: boolean) => {
      if (skipped || sequenceNumber < 0) {
        return;
      }

      const current = doneToolState.latestSequenceNumber ?? -1;
      doneToolState.latestSequenceNumber = Math.max(current, sequenceNumber);
    };
    // Accumulate the delta to the args
    doneToolState.args = (doneToolState.args || '') + options.inputTextDelta;

    // Use optimistic parsing to extract values even from incomplete JSON
    const parseResult = OptimisticJsonParser.parse(doneToolState.args);

    // Extract final_response from the optimistically parsed values - type-safe key
    const finalResponse = getOptimisticValue<string>(
      parseResult.extractedValues,
      FINAL_RESPONSE_KEY
    );

    // Extract assetsToReturn; can be full array or stringified
    const rawAssets = getOptimisticValue<unknown>(
      parseResult.extractedValues,
      ASSETS_TO_RETURN_KEY,
      []
    );

    type AssetToReturn = {
      assetId: string;
      assetName: string;
      assetType: ResponseMessageFileType;
      versionNumber: number;
    };

    const rawAssetItems: unknown[] = (() => {
      if (Array.isArray(rawAssets)) {
        return rawAssets;
      }
      if (typeof rawAssets === 'string') {
        try {
          const parsed: unknown = JSON.parse(rawAssets);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch {
          // ignore malformed JSON until more delta arrives
        }
      }
      return [];
    })();

    const assetsToInsert: AssetToReturn[] = [];
    for (const candidate of rawAssetItems) {
      if (!candidate || typeof candidate !== 'object') {
        continue;
      }

      const data = candidate as Record<string, unknown>;
      const assetId = typeof data.assetId === 'string' ? data.assetId : undefined;
      const assetName = typeof data.assetName === 'string' ? data.assetName : undefined;
      const rawType = data.assetType;
      const normalizedType =
        typeof rawType === 'string' &&
        ResponseMessageFileTypeSchema.options.includes(rawType as ResponseMessageFileType)
          ? (rawType as ResponseMessageFileType)
          : undefined;

      if (!assetId || !assetName || !normalizedType) {
        continue;
      }

      let versionNumber: number | undefined;
      if (typeof data.versionNumber === 'number') {
        versionNumber = data.versionNumber;
      } else if (typeof (data as { version_number?: unknown }).version_number === 'number') {
        versionNumber = (data as { version_number: number }).version_number;
      }

      if (versionNumber === undefined || Number.isNaN(versionNumber) || versionNumber <= 0) {
        try {
          versionNumber = await getAssetLatestVersion({
            assetId,
            assetType: normalizedType,
          });
        } catch (error) {
          console.error('[done-tool] Failed to fetch asset version, defaulting to 1:', error);
          versionNumber = 1;
        }
      }

      assetsToInsert.push({
        assetId,
        assetName,
        assetType: normalizedType,
        versionNumber,
      });
    }

    // Insert any newly completed asset items as response messages (dedupe via state)
    // Note: Reports are not added as file response messages, only non-report assets
    if (assetsToInsert.length > 0 && context.messageId) {
      const alreadyAdded = new Set(doneToolState.addedAssetIds || []);
      const newAssets = assetsToInsert.filter((a) => !alreadyAdded.has(a.assetId));

      // Filter out report_file assets from file responses - they don't get response messages
      const nonReportAssets = newAssets.filter((a) => a.assetType !== 'report_file');

      if (nonReportAssets.length > 0) {
        const fileResponses = nonReportAssets.map((a) => ({
          id: a.assetId,
          type: 'file' as const,
          file_type: a.assetType,
          file_name: a.assetName,
          version_number: a.versionNumber,
          filter_version_id: null,
          metadata: [
            {
              status: 'completed' as const,
              message: `Added ${a.assetType.replace('_file', '')} to response`,
              timestamp: Date.now(),
            },
          ],
        }));

        // Upsert file messages alone to ensure they appear before the final text
        const entriesForAssets: UpdateMessageEntriesParams = {
          messageId: context.messageId,
          responseMessages: fileResponses,
        };

        try {
          const result = await updateMessageEntries(entriesForAssets);
          recordSequence(result.sequenceNumber, result.skipped);
          // Update state to prevent duplicates on next deltas
          doneToolState.addedAssetIds = [
            ...(doneToolState.addedAssetIds || []),
            ...nonReportAssets.map((a) => a.assetId),
          ];
        } catch (error) {
          console.error('[done-tool] Failed to add asset response entries from delta:', error);
        }
      }

      // Store assets for chat update later (excluding reasoning which is not an asset type)
      const assetsForChatUpdate = newAssets.filter(
        (a): a is typeof a & { assetType: Exclude<typeof a.assetType, 'reasoning'> } =>
          a.assetType !== 'reasoning'
      );
      if (assetsForChatUpdate.length > 0) {
        doneToolState.addedAssets = [
          ...(doneToolState.addedAssets || []),
          ...assetsForChatUpdate.map((a) => ({
            assetId: a.assetId,
            assetType: a.assetType,
            versionNumber: a.versionNumber,
          })),
        ];
      }
    }

    if (finalResponse !== undefined && finalResponse !== '') {
      // Mark final reasoning now (after assets have been handled above) and before text streams
      if (context.messageId) {
        try {
          const timeString = formatElapsedTime(context.workflowStartTime, Date.now(), {
            includeDecimals: false,
          });

          await updateMessage(context.messageId, {
            finalReasoningMessage: `Reasoned for ${timeString}`,
          });

          // Update chat's most_recent fields with the first asset that was returned
          if (doneToolState.addedAssets && doneToolState.addedAssets.length > 0 && context.chatId) {
            try {
              const firstAsset = doneToolState.addedAssets[0];

              if (firstAsset) {
                await updateChat(context.chatId, {
                  mostRecentFileId: firstAsset.assetId,
                  mostRecentFileType: firstAsset.assetType,
                  mostRecentVersionNumber: firstAsset.versionNumber,
                });
              }
            } catch (error) {
              console.error('[done-tool] Failed to update chat most_recent fields:', error);
            }
          }
        } catch (error) {
          console.error('[done-tool] Failed to set final reasoning message in delta:', error);
        }
      }

      // Update the state with the extracted final_response
      doneToolState.finalResponse = finalResponse;

      // Create the response entries with the current state
      const doneToolResponseEntry = createDoneToolResponseMessage(
        doneToolState,
        options.toolCallId
      );
      const doneToolMessage = createDoneToolRawLlmMessageEntry(
        doneToolState,
        options.toolCallId || ''
      );

      const entries: UpdateMessageEntriesParams = {
        messageId: context.messageId,
      };

      if (doneToolResponseEntry) {
        entries.responseMessages = [doneToolResponseEntry];
      }

      if (doneToolMessage) {
        entries.rawLlmMessages = [doneToolMessage];
      }

      try {
        if (entries.responseMessages || entries.rawLlmMessages) {
          const result = await updateMessageEntries(entries);
          recordSequence(result.sequenceNumber, result.skipped);
        }
      } catch (error) {
        console.error('[done-tool] Failed to update done tool raw LLM message:', error);
      }
    }
  };
}
