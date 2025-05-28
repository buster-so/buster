import type { FileType } from '@/api/asset_interfaces/chat';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { assetParamsToRoute } from '@/lib/assets';

export const useGetFileLink = () => {
  const metricVersionNumber = useChatLayoutContextSelector((x) => x.metricVersionNumber);
  const dashboardVersionNumber = useChatLayoutContextSelector((x) => x.dashboardVersionNumber);
  const metricId = useChatLayoutContextSelector((x) => x.metricId);
  const dashboardId = useChatLayoutContextSelector((x) => x.dashboardId);
  const messageId = useChatLayoutContextSelector((x) => x.messageId);

  const getFileLink = useMemoizedFn(
    ({
      fileId,
      fileType,
      chatId,
      versionNumber,
      useVersionHistoryMode = false
    }: {
      fileId: string;
      fileType: FileType;
      chatId?: string;
      versionNumber?: number;
      useVersionHistoryMode?: boolean;
    }) => {
      return assetParamsToRoute({
        chatId,
        assetId: fileId,
        type: fileType,
        versionNumber,
        secondaryView: useVersionHistoryMode ? 'version-history' : undefined
      });
    }
  );

  const getFileIsSelected = useMemoizedFn(
    ({
      versionNumber,
      fileType,
      fileId
    }: {
      versionNumber?: number;
      fileType: FileType;
      fileId: string;
    }): boolean => {
      if (fileType === 'metric') {
        return versionNumber === metricVersionNumber && fileId === metricId;
      } else if (fileType === 'dashboard') {
        return versionNumber === dashboardVersionNumber && fileId === dashboardId;
      }

      if (fileType === 'reasoning') {
        return fileId === messageId;
      }

      return false;
    }
  );

  const getFileLinkMeta = useMemoizedFn(
    ({
      fileId,
      fileType,
      chatId,
      versionNumber,
      useVersionHistoryMode = false
    }: {
      fileId: string;
      fileType: FileType;
      chatId?: string;
      versionNumber?: number;
      useVersionHistoryMode?: boolean;
    }): {
      link: string | undefined;
      isSelected: boolean;
      selectedVersionNumber: number | undefined;
    } => {
      const link = getFileLink({ fileId, fileType, chatId, versionNumber, useVersionHistoryMode });
      const isSelected = getFileIsSelected({ versionNumber, fileType, fileId });

      const selectedVersionNumber = metricVersionNumber || dashboardVersionNumber;

      return { link, isSelected, selectedVersionNumber };
    }
  );

  return { getFileLinkMeta, getFileLink, getFileIsSelected };
};
