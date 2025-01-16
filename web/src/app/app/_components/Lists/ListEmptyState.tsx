import React from 'react';
import { AppMaterialIcons, Text, Title } from '@/components';
import { Button } from 'antd';

export const ListEmptyState: React.FC<{
  isAdmin?: boolean;
  title: string;
  description: string;
  onClick: () => void;
  buttonText: string;
  loading?: boolean;
}> = ({ isAdmin = true, title, buttonText, description, onClick, loading = false }) => {
  return (
    <div className="flex h-full w-full flex-col">
      <div
        className="flex h-full w-full flex-col items-center justify-start space-y-5 text-center"
        style={{
          marginTop: '25vh'
        }}>
        <div className="flex w-[350px] flex-col justify-center space-y-3">
          <Title level={4} className="text-center [text-wrap:balance]">
            {title}
          </Title>

          <Text type="secondary">{description}</Text>
        </div>

        {isAdmin && (
          <Button
            type="default"
            icon={<AppMaterialIcons icon="add" />}
            loading={loading}
            onClick={onClick}>
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};
