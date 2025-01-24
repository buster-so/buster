import { BusterUserAvatar } from '@/components';
import { AccessDropdown } from './AccessDropdown';

import React from 'react';
import { ShareRole } from '@/api/buster_socket/threads';
import { Text } from '@/components';
import { useMemoizedFn } from 'ahooks';

export const IndividualSharePerson: React.FC<{
  name: string;
  email: string;
  role: ShareRole;
  id: string;
  shareType: 'thread' | 'dashboard';
  onUpdateShareRole: (id: string, email: string, role: ShareRole | null) => void;
}> = React.memo(({ name, onUpdateShareRole, email, shareType, id, role }) => {
  const isSameEmailName = name === email;

  const onChangeShareLevel = useMemoizedFn((v: ShareRole | null) => {
    onUpdateShareRole(id, email, v);
  });

  return (
    <div className="flex items-center justify-between space-x-2 px-0 py-1">
      <div className="flex h-full items-center space-x-2">
        <div className="flex h-full flex-col items-center justify-center">
          <BusterUserAvatar size={24} name={name || email} />
        </div>
        <div className="flex flex-col space-y-0">
          <Text className="">{name || email}</Text>

          {isSameEmailName ? null : (
            <Text className="!text-sm" type="secondary">
              {email}
            </Text>
          )}
        </div>
      </div>

      <AccessDropdown shareLevel={role} showRemove={true} onChangeShareLevel={onChangeShareLevel} />
    </div>
  );
});

IndividualSharePerson.displayName = 'IndividualSharePerson';
