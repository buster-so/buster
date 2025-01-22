import { useAntToken } from '@/styles/useAntToken';
import React, { useMemo } from 'react';
import { Dropdown, Divider, MenuProps } from 'antd';
import { AppMaterialIcons } from '@/components';
import { ShareRole } from '@/api/buster_socket/threads';
import { DropdownLabel } from '@/components/dropdown';
import { Text } from '@/components';
import { useMemoizedFn } from 'ahooks';

export const AccessDropdown: React.FC<{
  groupShare?: boolean;
  className?: string;
  showRemove?: boolean;
  shareLevel?: ShareRole | null;
  onChangeShareLevel?: (level: ShareRole | null) => void;
}> = ({
  shareLevel,
  showRemove = true,
  groupShare = false,
  className = '',
  onChangeShareLevel
}) => {
  const token = useAntToken();

  const disabled = useMemo(() => {
    return shareLevel === ShareRole.OWNER;
  }, [shareLevel]);

  const items = useMemo(
    () =>
      groupShare
        ? [
            ...standardItems,
            {
              label: <DropdownLabel title="Not shared" subtitle="Does not have access." />,
              key: 'notShared'
            }
          ]
        : ([
            ...standardItems,
            showRemove && {
              label: 'Remove',
              key: 'remove'
            }
          ].filter(Boolean) as {
            label: string | React.ReactNode;
            key: string;
          }[]),
    [groupShare, standardItems, showRemove]
  );

  const selectedItem = useMemo(
    () =>
      groupShare && !shareLevel
        ? items.find((v) => v.key === 'notShared')!
        : items.find((v) => v.key === shareLevel) || items[items.length - 1],
    [groupShare, shareLevel, items]
  );

  const selectedLabel = useMemo(() => {
    if (!selectedItem) return 'No shared';
    if (selectedItem.key === ShareRole.OWNER) return 'Full access';
    if (selectedItem.key === ShareRole.EDITOR) return 'Can edit';
    if (selectedItem.key === ShareRole.VIEWER) return 'Can view';
    if (selectedItem.key === 'remove') return 'Remove';
    if (selectedItem.key === 'notShared') return 'Not shared';
    return selectedItem.label;
  }, [selectedItem, items]);

  const onSelectMenuItem = useMemoizedFn(({ key }: { key: string }) => {
    if (key === 'remove' || key === 'notShared') {
      onChangeShareLevel?.(null);
    } else {
      onChangeShareLevel?.(key as ShareRole);
    }
  });

  const dropdownRender = useMemoizedFn((menu: React.ReactNode) => {
    return (
      <div
        style={{
          backgroundColor: token.colorBgElevated,
          borderRadius: token.borderRadiusLG,
          boxShadow: token.boxShadowSecondary,
          maxWidth: '235px'
        }}>
        {React.cloneElement(menu as React.ReactElement, {
          style: {
            boxShadow: 'none'
          }
        })}

        <Divider />
        <div
          className="flex justify-center overflow-hidden p-2 px-2.5"
          style={{
            background: token.controlItemBgHover,
            borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px `
          }}>
          <Text type="secondary" className="!text-xs">
            Sharing cannot override permissions set by your account admins.
          </Text>
        </div>
      </div>
    );
  });

  const memoizedMenu: MenuProps = useMemo(() => {
    return {
      items,
      selectable: true,
      defaultSelectedKeys: [items[0]?.key as string],
      selectedKeys: [selectedItem.key as string],
      onSelect: onSelectMenuItem
    };
  }, [items, onSelectMenuItem, selectedItem]);

  return (
    <Dropdown
      disabled={disabled}
      destroyPopupOnHide
      trigger={['click']}
      menu={memoizedMenu}
      placement="bottomRight"
      dropdownRender={dropdownRender}>
      <Text
        type="secondary"
        size="xxs"
        className={`!flex cursor-pointer !items-center space-x-1 ${className}`}>
        <div>{selectedLabel}</div>
        {!disabled && <AppMaterialIcons icon="keyboard_arrow_down" />}
      </Text>
    </Dropdown>
  );
};

const standardItems = [
  {
    label: <DropdownLabel title="Full access" subtitle="Can edit and share with others." />,
    key: ShareRole.OWNER
  },
  {
    label: <DropdownLabel title="Can edit" subtitle="Can edit but not share with others." />,
    key: ShareRole.EDITOR
  },
  {
    label: <DropdownLabel title="Can view" subtitle="Can view but not edit." />,
    key: ShareRole.VIEWER
  }
];
