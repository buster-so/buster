import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces';
import { useGetDashboardVersionNumber } from '@/api/buster_rest/dashboards/dashboardQueryStore';
import { useGetMetricVersionNumber } from '@/api/buster_rest/metrics';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';

export const useGetIsSelectedFile = ({
  responseMessage
}: {
  responseMessage: Pick<BusterChatResponseMessage_file, 'file_type' | 'id' | 'version_number'>;
}): {
  isSelectedFile: boolean;
} => {
  const isSelectedFile = useChatIndividualContextSelector(
    (x) => x.selectedFileId === responseMessage.id
  );
  const { selectedVersionNumber: metricVersionNumber } = useGetMetricVersionNumber();
  const { selectedVersionNumber: dashboardVersionNumber } = useGetDashboardVersionNumber();

  const versionNumber = responseMessage.version_number;

  switch (responseMessage.file_type) {
    case 'metric': {
      const isSelectedVersion = versionNumber === metricVersionNumber;
      return { isSelectedFile: isSelectedFile && isSelectedVersion };
    }
    case 'dashboard': {
      const isSelectedVersion = versionNumber === dashboardVersionNumber;
      return { isSelectedFile: isSelectedFile && isSelectedVersion };
    }
    case 'report': {
      // TODO: Add report version number???
      return { isSelectedFile: isSelectedFile };
    }
    case 'reasoning': {
      return { isSelectedFile: false };
    }
    default: {
      const exhaustiveCheck: never = responseMessage.file_type;
      return { isSelectedFile: false };
    }
  }
};
