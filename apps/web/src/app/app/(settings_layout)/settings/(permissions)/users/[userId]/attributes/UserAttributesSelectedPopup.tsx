import React from 'react';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';

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
