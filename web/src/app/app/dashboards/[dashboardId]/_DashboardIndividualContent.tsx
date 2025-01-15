'use client';

import React, { useEffect } from 'react';
import { AppContent } from '../../_components/AppContent';
import { Input } from 'antd';
import {
  useDashboards,
  useDashboardContextSelector,
  useIndividualDashboard
} from '@/context/Dashboards';
import { BusterDashboardResponse } from '@/api/buster-rest';
import { DashboardIndividualDashboard } from './_DashboardIndividualDashboard';
import { EditableTitle } from '@/components';
import { useUserConfigContextSelector } from '@/context/Users';
import { ShareRole } from '@/api/buster-socket/threads';
import { useMemoizedFn } from 'ahooks';

export const DashboardIndividualContent: React.FC<{}> = ({}) => {
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const openedDashboardId = useDashboardContextSelector((x) => x.openedDashboardId);
  const { dashboardResponse: dashboardResponse } = useIndividualDashboard({
    dashboardId: openedDashboardId
  });
  const onUpdateDashboard = useDashboardContextSelector((x) => x.onUpdateDashboard);
  const onUpdateDashboardConfig = useDashboardContextSelector((x) => x.onUpdateDashboardConfig);
  const setEditingDashboardTitle = useDashboardContextSelector((x) => x.setEditingDashboardTitle);
  const editingDashboardTitle = useDashboardContextSelector((x) => x.editingDashboardTitle);
  const setOpenAddContentModal = useDashboardContextSelector((x) => x.setOpenAddContentModal);

  const isLoadingDashboard = !dashboardResponse?.dashboard?.id;
  const allowEdit = dashboardResponse?.permission !== ShareRole.VIEWER && !isAnonymousUser;

  return (
    <AppContent className="overflow-y-auto px-14 pt-12">
      {isLoadingDashboard ? (
        <SkeletonLoader />
      ) : (
        <DashboardContent
          allowEdit={allowEdit}
          onUpdateDashboard={onUpdateDashboard}
          dashboardResponse={dashboardResponse}
          onUpdateDashboardConfig={onUpdateDashboardConfig}
          setOpenAddContentModal={setOpenAddContentModal}
          isEditingTitle={editingDashboardTitle}
          onSetIsEditingTitle={setEditingDashboardTitle}
        />
      )}
    </AppContent>
  );
};

const DashboardContent: React.FC<{
  dashboardResponse: BusterDashboardResponse;
  onUpdateDashboard: ReturnType<typeof useDashboards>['onUpdateDashboard'];
  onUpdateDashboardConfig: ReturnType<typeof useDashboards>['onUpdateDashboardConfig'];
  setOpenAddContentModal: React.Dispatch<React.SetStateAction<boolean>>;
  isEditingTitle: boolean;
  onSetIsEditingTitle: (v: boolean) => void;
  allowEdit?: boolean;
}> = ({
  setOpenAddContentModal,
  dashboardResponse,
  onUpdateDashboardConfig,
  onUpdateDashboard,
  isEditingTitle,
  onSetIsEditingTitle,
  allowEdit
}) => {
  const dashboard = dashboardResponse?.dashboard;
  const { name: title, description, id } = dashboard;
  const loadedDashboard = !!id;

  const onChangeTitle = useMemoizedFn((title: string) => {
    onUpdateDashboard({
      name: title
    });
  });

  const onChangeDescription = useMemoizedFn((description: string) => {
    onUpdateDashboard({
      description
    });
  });

  const onOpenAddContentModal = useMemoizedFn(() => {
    setOpenAddContentModal(true);
  });

  return (
    <div className="flex flex-col space-y-3">
      <DashboardEditTitles
        title={title}
        allowEdit={allowEdit}
        isEditingTitle={isEditingTitle}
        onSetIsEditingTitle={onSetIsEditingTitle}
        description={description || ''}
        onChangeTitle={onChangeTitle}
        onChangeDescription={onChangeDescription}
        loadedDashboard={loadedDashboard}
      />

      <DashboardIndividualDashboard
        allowEdit={allowEdit}
        dashboardResponse={dashboardResponse}
        onUpdateDashboardConfig={onUpdateDashboardConfig}
        openAddContentModal={onOpenAddContentModal}
      />
    </div>
  );
};

const DashboardEditTitles: React.FC<{
  title: string;
  onChangeTitle: (title: string) => void;
  description: string;
  onChangeDescription: (description: string) => void;
  isEditingTitle: boolean;
  onSetIsEditingTitle: (v: boolean) => void;
  allowEdit?: boolean;
  loadedDashboard: boolean;
}> = React.memo(
  ({
    isEditingTitle,
    onSetIsEditingTitle,
    allowEdit,
    title,
    onChangeDescription,
    onChangeTitle,
    description,
    loadedDashboard
  }) => {
    const onChangeDashboardDescription = useMemoizedFn(
      (value: React.ChangeEvent<HTMLInputElement>) => {
        onChangeDescription(value.target.value);
      }
    );

    useEffect(() => {
      if (loadedDashboard && !title) {
        onSetIsEditingTitle(true);
      }
    }, [loadedDashboard]);

    return (
      <div className="flex flex-col space-y-1.5">
        <EditableTitle
          className="w-full truncate"
          editing={isEditingTitle}
          onEdit={onSetIsEditingTitle}
          disabled={!allowEdit}
          onChange={onChangeTitle}
          placeholder="New Dashboard"
          level={3}>
          {title}
        </EditableTitle>

        {(description || allowEdit) && (
          <Input
            variant="borderless"
            className={'!pl-0'}
            disabled={!allowEdit}
            onChange={onChangeDashboardDescription}
            defaultValue={description}
            placeholder="Add description..."
          />
        )}
      </div>
    );
  }
);
DashboardEditTitles.displayName = 'DashboardEditTitles';

const SkeletonLoader: React.FC = () => {
  return <div>{/* <Skeleton /> */}</div>;
};
