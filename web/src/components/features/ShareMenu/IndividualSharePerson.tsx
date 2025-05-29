import type { ShareAssetType, ShareRole } from '@/api/asset_interfaces';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';
import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { AccessDropdown } from './AccessDropdown';

export const IndividualSharePerson: React.FC<{
  name?: string;
  email: string;
  role: ShareRole;
  onUpdateShareRole: (email: string, role: ShareRole | null) => void;
  assetType: ShareAssetType;
  disabled: boolean;
}> = React.memo(({ name, onUpdateShareRole, email, role, assetType, disabled }) => {
  const isSameEmailName = name === email;

  const onChangeShareLevel = useMemoizedFn((v: ShareRole | null) => {
    onUpdateShareRole(email, v);
  });

  return (
    <div
      className="flex h-8 items-center justify-between space-x-2 overflow-hidden"
      data-testid={`share-person-${email}`}>
      <div className="flex h-full items-center space-x-1.5 overflow-hidden">
        <div className="flex h-full flex-col items-center justify-center">
          <Avatar className="h-[24px] w-[24px]" name={name || email} />
        </div>
        <div className="flex flex-col space-y-0 overflow-hidden">
          <Text truncate className="leading-1.3">
            {name || email}
          </Text>

          {isSameEmailName ? null : (
            <Text truncate size="xs" variant="tertiary" className="leading-1.3">
              {email}
            </Text>
          )}
        </div>
      </div>

      <AccessDropdown
        shareLevel={role}
        showRemove={true}
        disabled={disabled}
        onChangeShareLevel={onChangeShareLevel}
        assetType={assetType}
      />
    </div>
  );
});

IndividualSharePerson.displayName = 'IndividualSharePerson';
