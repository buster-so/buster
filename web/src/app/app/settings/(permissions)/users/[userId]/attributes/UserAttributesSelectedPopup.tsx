import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';

export const UserAttributesSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  userId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, userId }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[]}
    />
  );
});

UserAttributesSelectedPopup.displayName = 'UserAttributesSelectedPopup';
