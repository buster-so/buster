import React from 'react';
import { BusterUserAvatar, Text, Title, AppMaterialIcons } from '@/components';
import { OrganizationUser } from '@/api';
import { Button } from 'antd';

export const UserHeader = React.memo(({ user }: { user: OrganizationUser }) => {
  return (
    <div className="flex justify-between">
      <UserInfo user={user} />
      <ThreeDotMenu user={user} />
    </div>
  );
});

UserHeader.displayName = 'UserHeader';

const UserInfo: React.FC<{ user: OrganizationUser }> = ({ user }) => {
  return (
    <div className="flex items-center space-x-4">
      <BusterUserAvatar size={48} name={user.name} />
      <div className="flex flex-col">
        <Title level={4}>{user.name}</Title>
        <Text size="sm" type="secondary">
          {user.email}
        </Text>
      </div>
    </div>
  );
};

const ThreeDotMenu: React.FC<{ user: OrganizationUser }> = ({ user }) => {
  return <Button type="text" icon={<AppMaterialIcons icon={'more_vert'} />} size="small" />;
};
