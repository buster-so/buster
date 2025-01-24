'use client';

import { Button, Card } from 'antd';
import React, { useContext } from 'react';
import { Text, Title } from '@/components/text';
import { AppMaterialIcons } from '@/components/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const SettingsEmptyState: React.FC<{
  title?: string;
  description?: string;
  buttonText?: string;
  buttonAction?: () => void;
  buttonIcon?: React.ReactNode;
  showButton?: boolean;
}> = ({
  title = 'This page is coming soon.',
  description = `This page isn’t built yet, but one day it will be.`,
  buttonAction,
  buttonText = 'Request support',
  buttonIcon = <AppMaterialIcons icon="add" />,
  showButton = true
}) => {
  const { openInfoMessage } = useBusterNotifications();

  return (
    <Card
      classNames={{
        body: 'flex justify-center items-center flex-col  !py-10 '
      }}>
      <div className="flex max-w-[300px] flex-col items-center justify-center space-y-5">
        <div className="flex flex-col items-center space-y-3 text-center">
          <Title level={4}>{title}</Title>
          <Text type="secondary">{description}</Text>
        </div>

        {showButton && (
          <Button
            type="default"
            icon={buttonIcon}
            onClick={() => {
              if (buttonAction) {
                buttonAction();
              } else {
                openInfoMessage('Requesting support is not currently supported');
              }
            }}>
            {buttonText}
          </Button>
        )}
      </div>
    </Card>
  );
};
