import React, { useMemo } from 'react';
import { useStartChatFromReport } from './useStartChatFromAsset';
import { useStartChatFromAsset } from '@/api/buster_rest/chats';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterRoutes } from '@/routes/busterRoutes';
import { timeout } from '@/lib/timeout';
import {
  Dropdown,
  DropdownContent,
  type DropdownItem,
  type DropdownItems
} from '@/components/ui/dropdown';
import { Dots, ShareRight, WandSparkle, History, Star } from '@/components/ui/icons';
import { Refresh3, FileText } from '@/components/ui/icons/NucleoIconOutlined';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { Button } from '@/components/ui/buttons';
import {
  useAddReportToCollection,
  useGetReport,
  useRemoveReportFromCollection
} from '@/api/buster_rest/reports';
import { getIsEffectiveOwner } from '@/lib/share';
import { ShareMenuContent, getShareAssetConfig } from '@/components/features/ShareMenu';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { ASSET_ICONS } from '@/components/features/config/assetIcons';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { useListVersionDropdownItems } from '@/components/features/versionHistory/useListVersionDropdownItems';
import { useFavoriteStar } from '@/components/features/list/FavoriteStar';
import { useStatusDropdownContent } from '@/components/features/metrics/StatusBadgeIndicator/useStatusDropdownContent';
import type { VerificationStatus } from '@buster/server-shared/share';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useReportPageExport } from '@/controllers/ReportPageControllers/useReportPageExport';

export const ReportThreeDotMenu = React.memo(
  ({
    reportId,
    reportVersionNumber,
    isViewingOldVersion
  }: {
    reportId: string;
    reportVersionNumber: number | undefined;
    isViewingOldVersion: boolean;
  }) => {
    const editWithAI = useEditWithAI({ reportId });
    const shareMenu = useShareMenuSelectMenu({ reportId });
    const saveToLibrary = useSaveToLibrary({ reportId });
    const favoriteItem = useFavoriteReportSelectMenu({ reportId });
    const versionHistory = useVersionHistorySelectMenu({ reportId });
    // const verificationItem = useReportVerificationSelectMenu(); // Hidden - not supported yet
    const refreshReportItem = useRefreshReportSelectMenu({ reportId });
    // const duplicateReportItem = useDuplicateReportSelectMenu();
    const { dropdownItem: downloadPdfItem, exportPdfContainer } = useDownloadPdfSelectMenu({
      reportId
    });

    const items: DropdownItems = useMemo(() => {
      return [
        editWithAI,
        { type: 'divider' },
        shareMenu,
        saveToLibrary,
        favoriteItem,
        { type: 'divider' },
        versionHistory,
        // verificationItem, // Hidden - not supported yet
        { type: 'divider' },
        refreshReportItem,
        // duplicateReportItem,
        downloadPdfItem
      ];
    }, [
      reportId,
      reportVersionNumber,
      editWithAI,
      shareMenu,
      favoriteItem,
      versionHistory,
      // verificationItem,
      refreshReportItem,
      // duplicateReportItem,
      downloadPdfItem,
      saveToLibrary
    ]);

    return (
      <>
        <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
          <Button prefix={<Dots />} variant="ghost" data-testid="three-dot-menu-button" />
        </Dropdown>
        {exportPdfContainer}
      </>
    );
  }
);

ReportThreeDotMenu.displayName = 'ReportThreeDotMenu';

const useEditWithAI = ({ reportId }: { reportId: string }): DropdownItem => {
  const { onCreateFileClick, loading } = useStartChatFromReport({
    assetId: reportId,
    assetType: 'report'
  });

  return useMemo(
    () => ({
      label: 'Edit with AI',
      value: 'edit-with-ai',
      icon: <WandSparkle />,
      onClick: onCreateFileClick,
      loading
    }),
    [reportId, onCreateFileClick, loading]
  );
};

const useShareMenuSelectMenu = ({ reportId }: { reportId: string }) => {
  const { data: shareAssetConfig } = useGetReport({ reportId }, { select: getShareAssetConfig });
  const isEffectiveOwner = getIsEffectiveOwner(shareAssetConfig?.permission);

  return useMemo(
    () => ({
      label: 'Share report',
      value: 'share-report',
      icon: <ShareRight />,
      disabled: !isEffectiveOwner,
      items:
        isEffectiveOwner && shareAssetConfig
          ? [
              <ShareMenuContent
                key={reportId}
                shareAssetConfig={shareAssetConfig}
                assetId={reportId}
                assetType={'report'}
              />
            ]
          : undefined
    }),
    [reportId, shareAssetConfig, isEffectiveOwner]
  );
};

const useSaveToLibrary = ({ reportId }: { reportId: string }): DropdownItem => {
  const { mutateAsync: saveReportToCollection } = useAddReportToCollection();
  const { mutateAsync: removeReportFromCollection } = useRemoveReportFromCollection();

  const { data: selectedCollections } = useGetReport(
    { reportId },
    { select: (x) => x.collections?.map((x) => x.id) }
  );
  const { openInfoMessage } = useBusterNotifications();

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveReportToCollection({
      reportIds: [reportId],
      collectionIds
    });
    openInfoMessage('Report saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeReportFromCollection({
      reportIds: [reportId],
      collectionIds: [collectionId]
    });
    openInfoMessage('Report removed from collections');
  });

  const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections: selectedCollections || []
  });

  const CollectionSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  return useMemo(
    () => ({
      label: 'Add to collection',
      value: 'add-to-collection',
      icon: <ASSET_ICONS.collectionAdd />,
      items: [
        <React.Fragment key="collection-sub-menu">
          {CollectionSubMenu} {ModalComponent}
        </React.Fragment>
      ]
    }),
    [CollectionSubMenu]
  );
};

// Favorites for report (toggle add/remove)
const useFavoriteReportSelectMenu = ({ reportId }: { reportId: string }): DropdownItem => {
  const { data: name } = useGetReport({ reportId }, { select: (x) => x.name });
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: reportId,
    type: 'report',
    name: name || ''
  });

  return useMemo(
    () => ({
      label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
      value: 'toggle-favorite',
      icon: isFavorited ? <StarFilled /> : <Star />,
      onClick: onFavoriteClick,
      closeOnSelect: false
    }),
    [isFavorited, onFavoriteClick]
  );
};

// Version history for report
const useVersionHistorySelectMenu = ({ reportId }: { reportId: string }): DropdownItem => {
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const { data } = useGetReport(
    { reportId },
    {
      select: (x) => ({
        versions: x.versions,
        version_number: x.version_number
      })
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: DropdownItems = useListVersionDropdownItems({
    versions,
    selectedVersion: version_number,
    chatId,
    fileId: reportId,
    fileType: 'report',
    useVersionHistoryMode: true
  });

  const reverseVersionHistoryItems = useMemo(() => {
    return [...versionHistoryItems].reverse();
  }, [versionHistoryItems]);

  return useMemo(
    () => ({
      label: 'Version history',
      value: 'version-history',
      icon: <History />,
      items: [
        <React.Fragment key="version-history-sub-menu">
          <DropdownContent items={reverseVersionHistoryItems} selectType="single" />
        </React.Fragment>
      ]
    }),
    [reverseVersionHistoryItems]
  );
};

// Request verification dropdown (stubbed)
const useReportVerificationSelectMenu = (): DropdownItem => {
  const onChangeStatus = useMemoizedFn(async (_status: VerificationStatus) => {
    // stubbed
    return;
  });

  const dropdownProps = useStatusDropdownContent({
    isAdmin: false,
    selectedStatus: 'notRequested',
    onChangeStatus
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  return useMemo(
    () => ({
      label: 'Request verification',
      value: 'request-verification',
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>]
    }),
    [statusSubMenu]
  );
};

// Refresh report with latest data
const useRefreshReportSelectMenu = ({ reportId }: { reportId: string }): DropdownItem => {
  const { mutateAsync: startChatFromAsset, isPending } = useStartChatFromAsset();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onSetFileView = useChatLayoutContextSelector((x) => x.onSetFileView);

  const onClick = useMemoizedFn(async () => {
    try {
      const result = await startChatFromAsset({
        asset_id: reportId,
        asset_type: 'report',
        prompt: 'Please refresh this report with the most up-to-date data.'
      });

      // Navigate to the new chat with the report
      await onChangePage({
        route: BusterRoutes.APP_CHAT_ID_REPORT_ID,
        reportId: reportId,
        chatId: result.id
      });

      // Wait for the chat to load and set the file view
      await timeout(250);
      onSetFileView({
        fileId: reportId,
        fileView: 'chart'
      });
    } catch (error) {
      console.error('Failed to refresh report:', error);
    }
  });

  return useMemo(
    () => ({
      label: 'Refresh report',
      value: 'refresh-report',
      icon: <Refresh3 />,
      onClick,
      loading: isPending
    }),
    [onClick, isPending]
  );
};

// // Duplicate report (stubbed)
// const useDuplicateReportSelectMenu = (): DropdownItem => {
//   const onClick = useMemoizedFn(async () => {
//     alert('TODO: Duplicate report');
//     return;
//   });

//   return useMemo(
//     () => ({
//       label: 'Duplicate',
//       value: 'duplicate-report',
//       icon: <DuplicatePlus />,
//       onClick
//     }),
//     [onClick]
//   );
// };

// Download as PDF
const useDownloadPdfSelectMenu = ({
  reportId
}: {
  reportId: string;
}): {
  dropdownItem: DropdownItem;
  exportPdfContainer: React.ReactNode;
} => {
  const { openErrorMessage } = useBusterNotifications();
  const { data: reportName } = useGetReport({ reportId }, { select: (x) => x.name });
  const { exportReportAsPDF, cancelExport, ExportContainer } = useReportPageExport({
    reportId,
    reportName: reportName || ''
  });

  const onClick = async () => {
    try {
      await exportReportAsPDF();
    } catch (error) {
      console.error(error);
      openErrorMessage('Failed to export report as PDF');
    }
  };

  return useMemo(() => {
    return {
      dropdownItem: {
        label: 'Download as PDF',
        value: 'download-pdf',
        icon: <FileText />,
        onClick
      },
      exportPdfContainer: ExportContainer
    };
  }, [reportId, exportReportAsPDF, cancelExport, ExportContainer]);
};
