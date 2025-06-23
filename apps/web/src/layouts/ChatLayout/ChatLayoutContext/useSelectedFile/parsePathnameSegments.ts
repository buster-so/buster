export interface ChatURLParsed {
  metricId?: string;
  collectionId?: string;
  datasetId?: string;
  dashboardId?: string;
  chatId?: string;
  messageId?: string;
}

/*
This file is a hack because nextjs was not parsing the params with the useParams hook. Maybe future nextjs will fix this.
*/

export const parsePathnameSegments = (pathname: string): ChatURLParsed => {
  const params: ChatURLParsed = {};

  const segments = pathname.split('/').filter(Boolean);

  segments.forEach((segment, index) => {
    // Check for chats segment
    if (segment === 'chats' && segments[index + 1]) {
      params.chatId = segments[index + 1];
    }

    // Check for dashboards segment
    if (segment === 'dashboards' && segments[index + 1]) {
      params.dashboardId = segments[index + 1];
    }

    // Check for datasets segment
    if (segment === 'datasets' && segments[index + 1]) {
      params.datasetId = segments[index + 1];
    }

    // Check for reasoning segment with messageId
    if (segment === 'reasoning' && segments[index + 1]) {
      params.messageId = segments[index + 1];
    }

    // Check for metric segment
    if (segment === 'metrics' && segments[index + 1]) {
      params.metricId = segments[index + 1];
    }

    if (segment === 'collections' && segments[index + 1]) {
      params.collectionId = segments[index + 1];
    }
  });

  return params;
};
