import type { SelectedFile } from '../../interfaces';

export const createSelectedFile = (params: {
  metricId: string | undefined;
  collectionId: string | undefined;
  datasetId: string | undefined;
  dashboardId: string | undefined;
  chatId: string | undefined;
  messageId: string | undefined;
  metricVersionNumber: number | undefined;
  dashboardVersionNumber: number | undefined;
  reportId: string | undefined;
  reportVersionNumber: number | undefined;
}): SelectedFile | null => {
  const {
    metricId,
    collectionId,
    datasetId,
    dashboardId,
    chatId,
    messageId,
    metricVersionNumber,
    dashboardVersionNumber,
    reportId,
    reportVersionNumber
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

  if (reportId) {
    return {
      id: reportId,
      type: 'report',
      versionNumber: reportVersionNumber
    };
  }

  return null;
};
