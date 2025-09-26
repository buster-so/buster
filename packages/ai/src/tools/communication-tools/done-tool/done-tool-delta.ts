import {
  type UpdateMessageEntriesParams,
  getAssetLatestVersion,
  updateChat,
  updateMessage,
  updateMessageEntries,
} from '@buster/database/queries';
import {
  type ResponseMessageFileType,
  ResponseMessageFileTypeSchema,
} from '@buster/database/schema-types';
import type { ToolCallOptions } from 'ai';
import {
  OptimisticJsonParser,
  getOptimisticValue,
} from '../../../utils/streaming/optimistic-json-parser';
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
  return async function doneToolDelta(
    options: { inputTextDelta: string } & ToolCallOptions
  ): Promise<void> {
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
    };

    function isAssetToReturn(value: unknown): value is AssetToReturn {
      if (!value || typeof value !== 'object') return false;
      const obj = value as Record<string, unknown>;
      const idOk = typeof obj.assetId === 'string';
      const nameOk = typeof obj.assetName === 'string';
      const typeVal = obj.assetType;
      const typeOk =
        typeof typeVal === 'string' &&
        ResponseMessageFileTypeSchema.options.includes(typeVal as ResponseMessageFileType);
      return idOk && nameOk && typeOk;
    }

    let assetsToInsert: AssetToReturn[] = [];
    if (Array.isArray(rawAssets)) {
      assetsToInsert = rawAssets.filter(isAssetToReturn);
    } else if (typeof rawAssets === 'string') {
      try {
        const parsed: unknown = JSON.parse(rawAssets);
        if (Array.isArray(parsed)) {
          assetsToInsert = parsed.filter(isAssetToReturn);
        }
      } catch {
        // ignore malformed JSON until more delta arrives
      }
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
          version_number: 1,
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
          await updateMessageEntries(entriesForAssets);
          // Update state to prevent duplicates on next deltas
          doneToolState.addedAssetIds = [
            ...(doneToolState.addedAssetIds || []),
            ...nonReportAssets.map((a) => a.assetId),
          ];
        } catch (error) {
          console.error('[done-tool] Failed to add asset response entries from delta:', error);
        }
      }

      // Store ALL assets (including reports) for chat update later
      if (newAssets.length > 0) {
        doneToolState.addedAssets = [
          ...(doneToolState.addedAssets || []),
          ...newAssets.map((a) => ({ assetId: a.assetId, assetType: a.assetType })),
        ];
      }
    }

    if (finalResponse !== undefined && finalResponse !== '') {
      // Mark final reasoning now (after assets have been handled above) and before text streams
      if (context.messageId) {
        try {
          const currentTime = Date.now();
          const elapsedTimeMs = currentTime - context.workflowStartTime;
          const elapsedSeconds = Math.floor(elapsedTimeMs / 1000);

          let timeString: string;
          if (elapsedSeconds < 60) {
            timeString = `${elapsedSeconds} seconds`;
          } else {
            const elapsedMinutes = Math.floor(elapsedSeconds / 60);
            timeString = `${elapsedMinutes} minutes`;
          }

          await updateMessage(context.messageId, {
            finalReasoningMessage: `Reasoned for ${timeString}`,
          });

          // Update chat's most_recent fields with the first asset that was returned
          if (doneToolState.addedAssets && doneToolState.addedAssets.length > 0 && context.chatId) {
            try {
              const firstAsset = doneToolState.addedAssets[0];

              if (firstAsset) {
                // Get the actual version number from the database
                const versionNumber = await getAssetLatestVersion({
                  assetId: firstAsset.assetId,
                  assetType: firstAsset.assetType,
                });

                await updateChat(context.chatId, {
                  mostRecentFileId: firstAsset.assetId,
                  mostRecentFileType: firstAsset.assetType,
                  mostRecentVersionNumber: versionNumber,
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
          await updateMessageEntries(entries);
        }
      } catch (error) {
        console.error('[done-tool] Failed to update done tool raw LLM message:', error);
      }
    }
  };
}
