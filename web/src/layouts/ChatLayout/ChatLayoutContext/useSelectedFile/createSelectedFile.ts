import type { SelectedFile } from '../../interfaces';
import type { useGetChatParams } from '../useGetChatParams';

export const createSelectedFile = (
  params: ReturnType<typeof useGetChatParams>
): SelectedFile | null => {
  const {
    metricId,
    collectionId,
    datasetId,
    dashboardId,
    chatId,
    messageId,
    metricVersionNumber,
    dashboardVersionNumber
  } = params;

  if (metricId) {
    return {
      id: metricId,
      type: 'metric',
      versionNumber: metricVersionNumber
    };
  }

  if (dashboardId) {
    return {
      id: dashboardId,
      type: 'dashboard',
      versionNumber: dashboardVersionNumber
    };
  }

  if (messageId) {
    return {
      id: messageId,
      type: 'reasoning',
      versionNumber: undefined
    };
  }

  return null;
};
