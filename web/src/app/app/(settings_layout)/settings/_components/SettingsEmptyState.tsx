'use client';

import { Button } from '@/components/ui/buttons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card/CardBase';
import { Plus } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import type React from 'react';

export const SettingsEmptyState: React.FC<{
  title?: string;
  description?: string;
  buttonText?: string;
  buttonAction?: () => void;
  buttonIcon?: React.ReactNode;
  showButton?: boolean;
}> = ({
  title = 'This page is coming soon.',
  description = 'This page isn’t built yet, but one day it will be.',
  buttonAction,
  buttonText = 'Request support',
  buttonIcon = <Plus />,
  showButton = true
}) => {
  const { openInfoMessage } = useBusterNotifications();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      {showButton && (
        <CardContent className="pt-0!">
          <Button
            variant="default"
            prefix={buttonIcon}
            onClick={() => {
              if (buttonAction) {
                buttonAction();
              } else {
                openInfoMessage('Requesting support is not currently supported');
              }
            }}>
            {buttonText}
          </Button>
        </CardContent>
      )}
    </Card>
  );
};
