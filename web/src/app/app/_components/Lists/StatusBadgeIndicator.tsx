'use client';

import { BusterThreadListItem, BusterVerificationStatus } from '@/api/buster-rest';
import { AppMaterialIcons, AppPopoverMenu, AppTooltip } from '@/components';
import { useDashboardContextSelector } from '@/context/Dashboards';
import { useUserConfigContextSelector } from '@/context/Users';
import { useBusterThreadsContextSelector } from '@/context/Threads';
import { useMemoizedFn } from 'ahooks';
import { Button } from 'antd';
import React, { useMemo, useState } from 'react';
import { StatusNotRequestedIcon } from '@/assets';

export const StatusBadgeButton: React.FC<{
  status: BusterThreadListItem['status'];
  type: 'thread' | 'dashboard';
  id: string | string[];
  disabled?: boolean;
  onChangedStatus?: () => Promise<void>;
}> = React.memo(
  ({ type, id, status = BusterVerificationStatus.notRequested, onChangedStatus, disabled }) => {
    const onVerifiedDashboard = useDashboardContextSelector((state) => state.onVerifiedDashboard);
    const onVerifiedThread = useBusterThreadsContextSelector((state) => state.onVerifiedThread);
    const isAdmin = useUserConfigContextSelector((state) => state.isAdmin);
    const text = useMemo(() => getTooltipText(status), [status]);
    const [isOpen, setIsOpen] = React.useState(false);

    const onOpenChange = useMemoizedFn((open: boolean) => {
      setIsOpen(open);
    });

    const onChangeStatus = useMemoizedFn(async (newStatus: BusterVerificationStatus) => {
      const userStatus = [
        BusterVerificationStatus.notRequested,
        BusterVerificationStatus.requested
      ];

      if ((!isAdmin && !userStatus.includes(newStatus)) || newStatus === status) {
        return;
      }
      const verifyFunction =
        type === 'dashboard'
          ? (id: string) => onVerifiedDashboard({ dashboardId: id, status: newStatus })
          : (id: string) => onVerifiedThread({ threadId: id, status: newStatus });

      const ids = Array.isArray(id) ? id : [id];
      await Promise.all(ids.map(verifyFunction));
      setIsOpen(false);
      onChangedStatus?.();
    });

    const items = useMemo(
      () =>
        [
          {
            label: getTooltipText(BusterVerificationStatus.notRequested),
            icon: <StatusBadgeIndicator status={BusterVerificationStatus.notRequested} />,
            key: BusterVerificationStatus.notRequested,
            onClick: () => {
              onChangeStatus(BusterVerificationStatus.notRequested);
            }
          },
          {
            label: getTooltipText(BusterVerificationStatus.requested),
            icon: <StatusBadgeIndicator status={BusterVerificationStatus.requested} />,
            key: BusterVerificationStatus.requested,
            onClick: () => {
              onChangeStatus(BusterVerificationStatus.requested);
            }
          },
          {
            label: getTooltipText(BusterVerificationStatus.inReview),
            icon: <StatusBadgeIndicator status={BusterVerificationStatus.inReview} />,
            key: BusterVerificationStatus.inReview,
            disabled: !isAdmin,
            onClick: () => {
              isAdmin && onChangeStatus(BusterVerificationStatus.inReview);
            }
          },
          {
            label: getTooltipText(BusterVerificationStatus.verified),
            icon: <StatusBadgeIndicator status={BusterVerificationStatus.verified} />,
            key: BusterVerificationStatus.verified,
            disabled: !isAdmin,
            onClick: () => {
              isAdmin && onChangeStatus(BusterVerificationStatus.verified);
            }
          },
          {
            label: getTooltipText(BusterVerificationStatus.backlogged),
            icon: <StatusBadgeIndicator status={BusterVerificationStatus.backlogged} />,
            key: BusterVerificationStatus.backlogged,
            disabled: !isAdmin,
            onClick: () => {
              isAdmin && onChangeStatus(BusterVerificationStatus.backlogged);
            }
          }
        ].map((item, index) => ({
          index,
          ...item
        })),
      [isAdmin, status]
    );

    const selectedItem = useMemo(
      () => items.find((item) => item!.key === status) || items[0],
      [text]
    );

    return (
      <AppPopoverMenu
        items={items}
        trigger={['click']}
        onOpenChange={onOpenChange}
        open={isOpen}
        hideCheckbox
        doNotSortSelected={true}
        disabled={disabled}
        destroyPopupOnHide={true}
        selectedItems={selectedItem?.key ? [selectedItem.key! as string] : []}
        placement="bottomRight"
        headerContent={'Verification status...'}>
        <AppTooltip title={isOpen ? '' : 'Request verification from data team'}>
          <Button
            disabled={disabled || ((!id || status === 'verified') && !isAdmin)}
            icon={<StatusBadgeIndicator showTooltip={false} status={status} size={14} />}
            type={Array.isArray(id) ? 'default' : 'text'}>
            {Array.isArray(id) ? 'Status' : ''}
          </Button>
        </AppTooltip>
      </AppPopoverMenu>
    );
  }
);
StatusBadgeButton.displayName = 'StatusBadgeButton';

export const StatusBadgeIndicator: React.FC<{
  status: BusterThreadListItem['status'];
  size?: number;
  className?: string;
  showTooltip?: boolean;
}> = ({
  showTooltip = true,
  status = BusterVerificationStatus.notRequested,
  size = 16,
  className = ''
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const Icon = getIcon(status);
  const colorClasses = getColorClasses(status);
  const tooltipText = getTooltipText(status);
  const isNotVerified =
    status === BusterVerificationStatus.notVerified || BusterVerificationStatus.notRequested;
  const sharedClass = `h-[16px] w-[16px] flex items-center justify-center rounded-full ${colorClasses}`;
  const _size = isNotVerified ? size : 16;

  const mouseEvents = showTooltip
    ? { onMouseEnter: () => setIsHovering(true), onMouseLeave: () => setIsHovering(false) }
    : {};

  return (
    <AppTooltip title={showTooltip && isHovering ? tooltipText : ''} mouseEnterDelay={0.25}>
      <div
        {...mouseEvents}
        className={`rounded-full ${className} ${sharedClass} ${isNotVerified ? '' : ''}`}
        style={{
          width: _size,
          height: _size
        }}>
        <Icon size={_size * 1} />
      </div>
    </AppTooltip>
  );
};

const statusRecordIcon: Record<BusterVerificationStatus, React.FC<any>> = {
  [BusterVerificationStatus.verified]: () => <AppMaterialIcons icon="check_circle" fill />,
  [BusterVerificationStatus.requested]: () => <AppMaterialIcons icon="contrast" />, //contrast
  [BusterVerificationStatus.inReview]: () => <AppMaterialIcons icon="timelapse" />,
  [BusterVerificationStatus.backlogged]: () => <AppMaterialIcons icon="cancel" fill />,
  [BusterVerificationStatus.notVerified]: () => <StatusNotRequestedIcon />,
  [BusterVerificationStatus.notRequested]: () => <StatusNotRequestedIcon />
};
const getIcon = (status: BusterThreadListItem['status']) => {
  return statusRecordIcon[status] || (() => <AppMaterialIcons icon="motion_photos_on" />);
};

const statusRecordColors: Record<BusterVerificationStatus, string> = {
  verified: '!text-[#34A32D]',
  requested: '!text-[#F2BE01]',
  inReview: '!text-[#7C3AED]',
  backlogged: '!text-[#575859]',
  notVerified: '!text-[#575859]',
  notRequested: '!text-[#575859]'
};
const getColorClasses = (status: BusterThreadListItem['status']) => {
  return statusRecordColors[status] || statusRecordColors.notRequested;
};

const statusRecordText: Record<BusterVerificationStatus, string> = {
  verified: 'Verified',
  requested: 'Requested',
  inReview: 'In review',
  backlogged: 'Backlogged',
  notVerified: 'Not verified',
  notRequested: 'Not requested'
};

const getTooltipText = (status: BusterVerificationStatus) => {
  return statusRecordText[status] || statusRecordText.notRequested;
};

export const getShareStatus = ({ is_shared }: { is_shared: BusterThreadListItem['is_shared'] }) => {
  if (is_shared) return 'Shared';
  return 'Private';
};
