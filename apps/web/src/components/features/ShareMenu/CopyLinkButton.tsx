import React from 'react';
import { Button } from '@/components/ui/buttons';
import { Link } from '@/components/ui/icons';

export const CopyLinkButton: React.FC<{
  onCopyLink: () => void;
  text?: string;
}> = React.memo(({ onCopyLink, text = 'Copy link' }) => {
  return (
    <Button variant="ghost" onClick={onCopyLink} prefix={<Link />}>
      {text}
    </Button>
  );
});

CopyLinkButton.displayName = 'CopyLinkButton';
