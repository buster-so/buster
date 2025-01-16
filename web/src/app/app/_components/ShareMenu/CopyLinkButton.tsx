import { AppMaterialIcons } from '@/components';
import { Button } from 'antd';
import React from 'react';

export const CopyLinkButton: React.FC<{
  onCopyLink: () => void;
  text?: string;
}> = React.memo(({ onCopyLink, text = 'Copy link' }) => {
  return (
    <Button type="text" onClick={onCopyLink} icon={<AppMaterialIcons icon="link" size={16} />}>
      {text}
    </Button>
  );
});

CopyLinkButton.displayName = 'CopyLinkButton';
