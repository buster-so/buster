import type { SelectedFile } from '../../interfaces';

export const createSelectedFile = (params: {
  metricId?: string;
  collectionId?: string;
  datasetId?: string;
  dashboardId?: string;
  chatId?: string;
  messageId?: string;
  metricVersionNumber?: number;
  dashboardVersionNumber?: number;
}): SelectedFile | null => {
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
