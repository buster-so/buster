import type { GetReportResponse, ReportResponse } from '@buster/server-shared/reports';
import type { VerificationStatus } from '@buster/server-shared/share';
import React, { useCallback, useMemo } from 'react';
import {
  useAddReportToCollection,
  useGetReport,
  useRemoveReportFromCollection,
} from '@/api/buster_rest/reports';
import { useSaveToCollectionsDropdownContent } from '@/components/features/dropdowns/SaveToCollectionsDropdown';
import { useFavoriteStar } from '@/components/features/favorites/useFavoriteStar';
import { ASSET_ICONS } from '@/components/features/icons/assetIcons';
import { useStatusDropdownContent } from '@/components/features/metrics/StatusBadgeIndicator/useStatusDropdownContent';
import { getShareAssetConfig, ShareMenuContent } from '@/components/features/ShareMenu';
import { useListReportVersionDropdownItems } from '@/components/features/versionHistory/useListReportVersionDropdownItems';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownItem,
  createDropdownItems,
  Dropdown,
  DropdownContent,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Dots, History, PenSparkle, Star } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import {
  ArrowUpRight,
  Download4,
  DuplicatePlus,
  Redo,
  Refresh,
  Undo,
} from '@/components/ui/icons/NucleoIconOutlined';
import { useStartChatFromAsset } from '@/context/BusterAssets/useStartChatFromAsset';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useIsMac } from '@/hooks/usePlatform';
import { useEditorContext } from '@/layouts/AssetContainer/ReportAssetContainer';
import { canEdit, getIsEffectiveOwner } from '@/lib/share';
import { useShareMenuSelectMenu } from './threeDotMenuHooks';

export const ReportThreeDotMenu = React.memo(
  ({
    reportId,
    isViewingOldVersion,
  }: {
    reportId: string;
    reportVersionNumber: number | undefined;
    isViewingOldVersion: boolean;
  }) => {
    const chatId = useGetChatId();
    const openReport = useOpenReport({ reportId });
    const editWithAI = useEditWithAI({ reportId });
    const shareMenu = useShareMenuSelectMenu({ reportId });
    const saveToLibrary = useSaveToLibrary({ reportId });
    const favoriteItem = useFavoriteReportSelectMenu({ reportId });
    const versionHistory = useVersionHistorySelectMenu({ reportId });
    const undoRedo = useUndoRedo();
    // const duplicateReport = useDuplicateReportSelectMenu({ reportId }); TODO: EITHER Implement backend or remove feature
    // const verificationItem = useReportVerificationSelectMenu(); // Hidden - not supported yet
    const refreshReportItem = useRefreshReportSelectMenu({ reportId });
    // const { dropdownItem: downloadPdfItem, exportPdfContainer } = useDownloadPdfSelectMenu({
    //   reportId,
    // });
    const { data: permission } = useGetReport(
      { id: reportId },
      { select: useCallback((x: GetReportResponse) => x.permission, []) }
    );

    const isEffectiveOwner = getIsEffectiveOwner(permission);
    const isEditor = canEdit(permission);

    const items: IDropdownItems = useMemo(() => {
      return [
        ...(chatId ? [openReport, { type: 'divider' }] : []),
        editWithAI,
        { type: 'divider' },
        isEffectiveOwner && !isViewingOldVersion && shareMenu,
        saveToLibrary,
        favoriteItem,
        ...(isEditor ? [{ type: 'divider' }, ...undoRedo] : []),
        ...(isEditor ? [{ type: 'divider' }, versionHistory] : []),
        // verificationItem, // Hidden - not supported yet
        { type: 'divider' },
        isEditor && refreshReportItem,
        // duplicateReport, TODO: EITHER Implement backend or remove feature
        //  downloadPdfItem,
      ].filter(Boolean) as IDropdownItems;
    }, [
      chatId,
      openReport,
      editWithAI,
      isEffectiveOwner,
      isViewingOldVersion,
      shareMenu,
      saveToLibrary,
      favoriteItem,
      undoRedo,
      versionHistory,
      isEditor,
      refreshReportItem,
      // duplicateReport, TODO: EITHER Implement backend or remove feature
      //  downloadPdfItem,
    ]);

    return (
      <>
        <Dropdown items={items} side="bottom" align="end" contentClassName="max-h-fit" modal>
          <Button prefix={<Dots />} variant="ghost" data-testid="three-dot-menu-button" />
        </Dropdown>
        {/* {exportPdfContainer} */}
      </>
    );
  }
);

ReportThreeDotMenu.displayName = 'ReportThreeDotMenu';

const useEditWithAI = ({ reportId }: { reportId: string }): IDropdownItem => {
  const { data: shareAssetConfig } = useGetReport(
    { id: reportId },
    { select: getShareAssetConfig }
  );
  const isEditor = canEdit(shareAssetConfig?.permission);

  const { onCreateFileClick, loading } = useStartChatFromAsset({
    assetId: reportId,
    assetType: 'report_file',
  });

  return useMemo(
    () =>
      createDropdownItem({
        label: 'Edit with AI',
        value: 'edit-with-ai',
        icon: <PenSparkle />,
        onClick: onCreateFileClick,
        disabled: !isEditor,
        loading,
      }),
    [reportId, onCreateFileClick, loading, isEditor]
  );
};

const useSaveToLibrary = ({ reportId }: { reportId: string }): IDropdownItem => {
  const { mutateAsync: saveReportToCollection } = useAddReportToCollection();
  const { mutateAsync: removeReportFromCollection } = useRemoveReportFromCollection();

  const { data: selectedCollections } = useGetReport(
    { id: reportId },
    { select: useCallback((x: ReportResponse) => x.collections?.map((x) => x.id), []) }
  );
  const { openInfoMessage } = useBusterNotifications();

  const onSaveToCollection = useMemoizedFn(async (collectionIds: string[]) => {
    await saveReportToCollection({
      reportIds: [reportId],
      collectionIds,
    });
    openInfoMessage('Report saved to collections');
  });

  const onRemoveFromCollection = useMemoizedFn(async (collectionId: string) => {
    await removeReportFromCollection({
      reportIds: [reportId],
      collectionIds: [collectionId],
    });
    openInfoMessage('Report removed from collections');
  });

  const { ModalComponent, ...dropdownProps } = useSaveToCollectionsDropdownContent({
    onSaveToCollection,
    onRemoveFromCollection,
    selectedCollections: selectedCollections || [],
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
        </React.Fragment>,
      ],
    }),
    [CollectionSubMenu]
  );
};

// Favorites for report (toggle add/remove)
const stableReportNameSelector = (state: ReportResponse) => state.name;
const useFavoriteReportSelectMenu = ({ reportId }: { reportId: string }): IDropdownItem => {
  const { data: name } = useGetReport({ id: reportId }, { select: stableReportNameSelector });
  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: reportId,
    type: 'report_file',
    name: name || '',
  });

  return useMemo(
    () =>
      createDropdownItem({
        label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
        value: 'toggle-favorite',
        icon: isFavorited ? <StarFilled /> : <Star />,
        onClick: () => onFavoriteClick(),
        closeOnSelect: false,
      }),
    [isFavorited, onFavoriteClick]
  );
};

// Version history for report
const useVersionHistorySelectMenu = ({ reportId }: { reportId: string }): IDropdownItem => {
  const chatId = useGetChatId();
  const { data } = useGetReport(
    { id: reportId },
    {
      select: useCallback(
        (x: GetReportResponse) => ({
          versions: x.versions,
          version_number: x.version_number,
        }),
        []
      ),
    }
  );
  const { versions = [], version_number } = data || {};

  const versionHistoryItems: IDropdownItems = useListReportVersionDropdownItems({
    versions,
    selectedVersion: version_number,
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
        </React.Fragment>,
      ],
    }),
    [reverseVersionHistoryItems]
  );
};

// Request verification dropdown (stubbed)
const useReportVerificationSelectMenu = (): IDropdownItem => {
  const onChangeStatus = useMemoizedFn(async (_status: VerificationStatus) => {
    // stubbed
    return;
  });

  const dropdownProps = useStatusDropdownContent({
    isAdmin: false,
    selectedStatus: 'notRequested',
    onChangeStatus,
  });

  const statusSubMenu = useMemo(() => {
    return <DropdownContent {...dropdownProps} />;
  }, [dropdownProps]);

  return useMemo(
    () => ({
      label: 'Request verification',
      value: 'request-verification',
      items: [<React.Fragment key="status-sub-menu">{statusSubMenu}</React.Fragment>],
    }),
    [statusSubMenu]
  );
};

// Refresh report with latest data
const useRefreshReportSelectMenu = ({ reportId }: { reportId: string }): IDropdownItem => {
  const { onCreateFileClick, loading: isPending } = useStartChatFromAsset({
    assetId: reportId,
    assetType: 'report_file',
    prompt: 'Hey Buster. Please refresh the report with the latest data.',
  });

  const onClick = useMemoizedFn(async () => {
    try {
      await onCreateFileClick();
    } catch (error) {
      console.error('Failed to refresh report:', error);
    }
  });

  return useMemo(
    () => ({
      label: 'Refresh report',
      value: 'refresh-report',
      icon: <Refresh />,
      onClick,
      loading: isPending,
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

const useUndoRedo = (): IDropdownItems => {
  const { editor } = useEditorContext();
  const isMac = useIsMac();
  const getEditor = () => {
    if (!editor?.current) {
      console.warn('Editor is not defined');
      return;
    }
    return editor?.current;
  };
  return useMemo(
    () =>
      createDropdownItems([
        {
          label: 'Undo',
          value: 'undo',
          shortcut: isMac ? '⌘+Z' : 'Ctrl+Z',
          icon: <Undo />,
          onClick: () => {
            const editorInstance = getEditor();
            editorInstance?.undo();
          },
        },
        {
          label: 'Redo',
          value: 'redo',
          shortcut: isMac ? '⌘+⇧+Z' : 'Ctrl+⇧+Z',
          icon: <Redo />,
          onClick: () => {
            const editorInstance = getEditor();
            editorInstance?.redo();
          },
        },
      ]),
    [isMac]
  );
};

const useDuplicateReportSelectMenu = ({ reportId }: { reportId: string }): IDropdownItem => {
  return useMemo(
    () => ({
      label: 'Duplicate',
      value: 'duplicate-report',
      icon: <DuplicatePlus />,
      onClick: () => {
        alert('This feature is not available yet');
      },
    }),
    [reportId]
  );
};

const useOpenReport = ({ reportId }: { reportId: string }): IDropdownItem => {
  return useMemo(
    () =>
      createDropdownItem({
        label: 'Open report',
        value: 'open-report',
        icon: <ArrowUpRight />,
        linkIcon: 'none',
        link: {
          to: '/app/reports/$reportId',
          params: {
            reportId,
          },
        },
      }),
    [reportId]
  );
};
