import { Button } from '@/components/ui/buttons';
import { ShareRight } from '@/components/ui/icons';
import React from 'react';

export const ShareButton = React.memo(() => {
  return <Button variant="ghost" prefix={<ShareRight />} data-testid="share-button" />;
});

ShareButton.displayName = 'ShareButton';
