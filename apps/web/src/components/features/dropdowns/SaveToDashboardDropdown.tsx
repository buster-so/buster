import { useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useMemo, useState } from 'react';
import type { BusterDashboardListItem } from '@/api/asset_interfaces';
import { useGetDashboardsList } from '@/api/buster_rest/dashboards';
import { NewDashboardModal } from '@/components/features/modals/NewDashboardModal';
import { Button } from '@/components/ui/buttons';
import { createDropdownItem } from '@/components/ui/dropdown';
import { Dropdown, type DropdownProps } from '@/components/ui/dropdown/Dropdown';
import { Plus } from '@/components/ui/icons';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const SaveToDashboardDropdown: React.FC<{
  children: React.ReactNode;
  selectedDashboards: string[];
  side?: 'top' | 'bottom';
  align?: 'start' | 'end' | 'center';
  onOpenChange?: (open: boolean) => void;
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string[]) => Promise<void>;
}> = ({
  children,
  onRemoveFromDashboard,
  onSaveToDashboard,
  selectedDashboards,
  side = 'bottom',
  align = 'end',
  onOpenChange: onOpenChangeProp,
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const onOpenChange = useMemoizedFn((open: boolean) => {
    setShowDropdown(open);
    onOpenChangeProp?.(open);
  });

  const { ModalComponent, ...dropdownProps } = useSaveToDashboardDropdownContent({
    selectedDashboards,
    onSaveToDashboard,
    onRemoveFromDashboard,
  });

  return (
    <>
      <Dropdown
        side={side}
        align={align}
        open={showDropdown}
        onOpenChange={onOpenChange}
        {...dropdownProps}
      >
        {children}
      </Dropdown>
      {ModalComponent}
    </>
  );
};

export const useSaveToDashboardDropdownContent = ({
  selectedDashboards,
  onSaveToDashboard,
  onRemoveFromDashboard,
}: {
  selectedDashboards: string[];
  onSaveToDashboard: (dashboardId: string[]) => Promise<void>;
  onRemoveFromDashboard: (dashboardId: string[]) => Promise<void>;
}): Pick<
  DropdownProps,
  'items' | 'footerContent' | 'menuHeader' | 'selectType' | 'emptyStateText'
> & {
  ModalComponent: React.ReactNode;
} => {
  const navigate = useNavigate();
  const { data: dashboardsList } = useGetDashboardsList({}, { staleTime: 60 * 1000 });
  const [openNewDashboardModal, setOpenNewDashboardModal] = useState(false);

  const onClickItem = useMemoizedFn(async (dashboard: BusterDashboardListItem) => {
    const isSelected = selectedDashboards.some((d) => d === dashboard.id);
    if (isSelected) {
      await onRemoveFromDashboard([dashboard.id]);
    } else {
      await onSaveToDashboard([dashboard.id]);
    }
  });

  const items: DropdownProps['items'] = useMemo(
    () =>
      (dashboardsList?.data || [])?.map((dashboard) => {
        return createDropdownItem({
          value: dashboard.id,
          label: dashboard.name || 'New dashboard',
          selected: selectedDashboards.some((d) => d === dashboard.id),
          closeOnSelect: false,
          onClick: (e) => {
            e.stopPropagation();
            e.preventDefault();
            onClickItem(dashboard);
          },
          link: {
            to: '/app/dashboards/$dashboardId',
            params: {
              dashboardId: dashboard.id,
            },
          },
        });
      }),
    [dashboardsList, selectedDashboards]
  );

  const onDashboardCreated = useMemoizedFn(async (dashboardId: string) => {
    await onSaveToDashboard([dashboardId]);
    navigate({
      to: '/app/dashboards/$dashboardId',
      params: {
        dashboardId: dashboardId,
      },
    });
  });

  const footerContent = useMemo(() => {
    return (
      <Button
        variant="ghost"
        className="justify-start!"
        block
        prefix={<Plus />}
        onClick={() => setOpenNewDashboardModal(true)}
      >
        New dashboard
      </Button>
    );
  }, []);

  const menuHeader = useMemo(() => {
    return items.length > 0 ? 'Save to a dashboard' : undefined;
  }, [items.length]);

  const onCloseNewDashboardModal = useMemoizedFn(() => {
    setOpenNewDashboardModal(false);
  });

  return useMemo(
    () => ({
      items,
      footerContent,
      menuHeader,
      selectType: 'multiple',
      emptyStateText: 'No dashboards found',
      ModalComponent: (
        <NewDashboardModal
          open={openNewDashboardModal}
          onClose={onCloseNewDashboardModal}
          useChangePage={false}
          onDashboardCreated={onDashboardCreated}
        />
      ),
    }),
    [items, footerContent, menuHeader, openNewDashboardModal, onDashboardCreated]
  );
};
