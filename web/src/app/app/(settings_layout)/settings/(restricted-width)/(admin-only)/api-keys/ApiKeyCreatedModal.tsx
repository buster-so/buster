import { AppModal } from '@/components/ui/modal';
import { Paragraph } from '@/components/ui/typography';
import React from 'react';
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
        <div
          className="mb-4 rounded-lg border border-yellow-200 bg-yellow-100 p-4 text-sm text-yellow-700 shadow"
          role="alert">
          <span className="font-medium">Important:</span> This API key will only be shown once.
          Please copy it now and store it safely.
        </div>
        <Paragraph className="mt-4 rounded-sm border bg-gray-50 p-4 font-mono break-all shadow">
          {apiKey}
        </Paragraph>
      </div>
    </AppModal>
  );
});

ApiKeyCreatedModal.displayName = 'ApiKeyCreatedModal';

export default ApiKeyCreatedModal;
