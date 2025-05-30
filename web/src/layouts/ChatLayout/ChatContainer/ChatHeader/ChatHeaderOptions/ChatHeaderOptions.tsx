'use client';

import React from 'react';
import { Button } from '@/components/ui/buttons';
import { Dots } from '@/components/ui/icons';
import { ChatContainerHeaderDropdown } from './ChatHeaderDropdown';

export const ChatHeaderOptions: React.FC = React.memo(() => {
  return (
    <ChatContainerHeaderDropdown>
      <Button variant="ghost" prefix={<Dots />} data-testid="chat-header-options-button" />
    </ChatContainerHeaderDropdown>
  );
});

ChatHeaderOptions.displayName = 'ChatHeaderOptions';
