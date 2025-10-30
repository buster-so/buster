import type { ShareAssetType, ShareRole, WorkspaceShareRole } from '@buster/server-shared/share';
import last from 'lodash/last';
import React, { useMemo } from 'react';
import type { DropdownDivider, IDropdownItem } from '@/components/ui/dropdown';
import { Dropdown } from '@/components/ui/dropdown';
import { ChevronDown } from '@/components/ui/icons/NucleoIconFilled';
import { Paragraph, Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';

type DropdownValue = ShareRole | WorkspaceShareRole | 'remove';

type AccessDropdownBaseProps = {
  assetType: ShareAssetType;
  disabled: boolean;
  className?: string;
};

type AccessDropdownUserProps = {
  showRemove?: boolean;
  shareLevel: ShareRole | null;
  type: 'user';
  onChangeShareLevel?: (level: ShareRole | null) => void;
};

type AccessDropdownWorkspaceProps = {
  type: 'workspace';
  shareLevel: WorkspaceShareRole | null;
  onChangeShareLevel?: (level: WorkspaceShareRole | null) => void;
};

type AccessDropdownProps = AccessDropdownBaseProps &
  (AccessDropdownUserProps | AccessDropdownWorkspaceProps);

export const AccessDropdown: React.FC<AccessDropdownProps> = React.memo(
  ({ shareLevel, disabled, className = '', onChangeShareLevel, assetType, ...props }) => {
    const showRemove = props.type === 'user' && props.showRemove;

    const items = useMemo(() => {
      const isWorkspace = props.type === 'workspace';

      const baseItems: (IDropdownItem<DropdownValue> | DropdownDivider)[] = [
        ...(isWorkspace ? workspaceItems : itemsRecord[assetType] || []),
      ];

      if (showRemove) {
        baseItems.push({ type: 'divider' });
        baseItems.push({
          label: 'Remove',
          value: 'remove',
        });
      }

      return baseItems.map((item) => ({
        ...item,
        selected: (item as IDropdownItem<DropdownValue>).value === shareLevel,
      }));
    }, [showRemove, shareLevel, assetType, props.type]);

    const selectedLabel = useMemo(() => {
      const defaultLabel = props.type === 'workspace' ? WORKSPACE_NOT_SHARED_ITEM : OWNER_ITEM;
      const selectedItem = items.find((item) => item.selected) || defaultLabel;
      const { value } = selectedItem as IDropdownItem<DropdownValue>;
      // Using a type-safe switch to handle all ShareRole values
      switch (value) {
        case 'full_access':
          return 'Full access';
        case 'can_edit':
          return 'Can edit';
        case 'can_view':
          return 'Can view';
        case 'owner':
          return 'Owner';
        case 'remove':
          return 'Remove';
        case 'viewer':
          return 'Viewer';
        case 'can_filter':
          return 'Can filter';
        case 'none':
          return 'Not shared';
        default: {
          const _exhaustiveCheck: never | undefined = value;
          return value;
        }
      }
    }, [items, props.type]);

    const onSelectMenuItem = useMemoizedFn((value: string) => {
      if (value === 'remove' || value === 'notShared') {
        onChangeShareLevel?.(null);
      } else {
        if (props.type === 'workspace') {
          (onChangeShareLevel as (level: WorkspaceShareRole | null) => void)?.(
            value as WorkspaceShareRole
          );
        } else {
          (onChangeShareLevel as (level: ShareRole | null) => void)?.(value as ShareRole);
        }
      }
    });

    return (
      <Dropdown
        items={items}
        disabled={disabled}
        footerContent={<FooterContent />}
        footerClassName="p-0!"
        onSelect={onSelectMenuItem}
        sideOffset={14}
        selectType="single"
        align="end"
        side="bottom"
      >
        <Text
          dataTestId={`share-role-${shareLevel}`}
          variant="secondary"
          size="xs"
          className={cn('flex! items-center! space-x-1', !disabled && 'cursor-pointer', className)}
        >
          <span className="truncate">{selectedLabel}</span>
          {!disabled && (
            <span className="text-2xs text-icon-color">
              <ChevronDown />
            </span>
          )}
        </Text>
      </Dropdown>
    );
  }
);

AccessDropdown.displayName = 'AccessDropdown';

const metricItems: IDropdownItem<ShareRole>[] = [
  {
    value: 'full_access',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.',
  },
  {
    value: 'can_edit',
    label: 'Can edit',
    secondaryLabel: 'Can edit but not share with others.',
  },
  {
    value: 'can_view',
    label: 'Can view',
    secondaryLabel: 'Can view asset but not edit.',
  },
];

const dashboardItems: IDropdownItem<ShareRole>[] = [
  {
    value: 'full_access',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.',
  },
  {
    value: 'can_edit',
    label: 'Can edit',
    secondaryLabel: 'Can edit but not share with others.',
  },
  {
    value: 'can_view',
    label: 'Can view',
    secondaryLabel: 'Can view dashboard and metrics but not edit.',
  },
];

const collectionItems: IDropdownItem<ShareRole>[] = metricItems;

const reportItems: IDropdownItem<ShareRole>[] = metricItems;

const workspaceItems: IDropdownItem<WorkspaceShareRole>[] = [
  {
    value: 'full_access',
    label: 'Full access',
    secondaryLabel: 'Can edit and share with others.',
  },
  {
    value: 'can_edit',
    label: 'Can edit',
    secondaryLabel: 'Can edit, but not share with others.',
  },
  {
    value: 'can_view',
    label: 'Can view',
    secondaryLabel: 'Cannot edit or share with others.',
  },
  {
    value: 'none',
    label: 'Not shared',
    secondaryLabel: 'Does not have access.',
  },
];

const itemsRecord: Record<ShareAssetType, IDropdownItem<ShareRole>[]> = {
  dashboard_file: dashboardItems,
  metric_file: metricItems,
  collection: collectionItems,
  chat: collectionItems,
  report_file: reportItems,
};

const OWNER_ITEM: IDropdownItem<DropdownValue> = {
  value: 'owner',
  label: 'Owner',
  secondaryLabel: 'Owner of the asset.',
};

const WORKSPACE_NOT_SHARED_ITEM: IDropdownItem<DropdownValue> = last(
  workspaceItems
) as IDropdownItem<DropdownValue>;

const FooterContent = React.memo(() => {
  return (
    <div className="bg-item-hover flex justify-center overflow-hidden rounded-b p-2 px-2.5">
      <Paragraph variant="secondary" size="xs">
        Sharing cannot override permissions set by your account admins.
      </Paragraph>
    </div>
  );
});
FooterContent.displayName = 'FooterContent';
