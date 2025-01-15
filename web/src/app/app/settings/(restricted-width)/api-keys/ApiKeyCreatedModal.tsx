import React from 'react';
import { Typography, Alert } from 'antd';
import { AppModal } from '@/components';

const { Paragraph } = Typography;

interface ApiKeyCreatedModalProps {
  apiKey: string | null;
  onCopy: () => void;
  onClose: () => void;
}

const ApiKeyCreatedModal = React.memo(({ apiKey, onCopy, onClose }: ApiKeyCreatedModalProps) => {
  return (
    <AppModal
      open={!!apiKey}
      footer={{
        primaryButton: {
          text: 'Copy API Key',
          onClick: onCopy
        },
        secondaryButton: {
          text: 'Close',
          onClick: onClose
        }
      }}
      header={{
        title: 'New API key created'
      }}
      onClose={onClose}>
      <div className="space-y-4">
        <Alert
          type="warning"
          message="Important: This API key will only be shown once. Please copy it now and store it safely."
        />
        <Paragraph className="mt-4 break-all rounded border bg-gray-50 p-4 font-mono">
          {apiKey}
        </Paragraph>
      </div>
    </AppModal>
  );
});

ApiKeyCreatedModal.displayName = 'ApiKeyCreatedModal';

export default ApiKeyCreatedModal;
