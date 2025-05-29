import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';
import React from 'react';

export const ListUserItem = React.memo(({ name, email }: { name: string; email: string }) => {
  return (
    <div className="flex w-full items-center space-x-2">
      <div className="flex items-center">
        <Avatar size={24} name={name} />
      </div>

      <div className="flex flex-col justify-center space-y-0">
        {name && <Text>{name}</Text>}
        {email && (
          <Text variant="secondary" style={{ fontSize: 12 }}>
            {email}
          </Text>
        )}
      </div>
    </div>
  );
});
ListUserItem.displayName = 'ListUserItem';
