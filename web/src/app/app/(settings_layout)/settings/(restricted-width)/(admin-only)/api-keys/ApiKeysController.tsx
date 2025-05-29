'use client';

import { useCreateApiKey, useDeleteApiKey, useGetApiKeys } from '@/api/buster_rest/api_keys';
import { Button } from '@/components/ui/buttons';
import { useMemoizedFn } from '@/hooks';
import type React from 'react';
import { useState } from 'react';
import { ApiKeyListItem } from './ApiKeyListItem';
import { ApiKeysLoading } from './ApiKeysLoading';

import { Plus } from '@/components/ui/icons';
import { useBusterNotifications } from '@/context/BusterNotifications';
import ApiKeyCreatedModal from './ApiKeyCreatedModal';

export const ApiKeysController: React.FC = () => {
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const { data: apiKeys, isLoading } = useGetApiKeys();
  const createApiKeyMutation = useCreateApiKey();
  const deleteApiKeyMutation = useDeleteApiKey();
  const { openInfoMessage, openErrorMessage, openConfirmModal } = useBusterNotifications();

  const handleCreateApiKey = useMemoizedFn(async () => {
    try {
      const result = await createApiKeyMutation.mutateAsync(`API Key ${new Date().toISOString()}`);
      setNewApiKey(result.api_key);
    } catch (error) {
      console.error('Failed to create API key:', error);
      openErrorMessage('Failed to create API key');
    }
  });

  const handleDeleteApiKey = useMemoizedFn(async (id: string) => {
    openConfirmModal({
      title: 'Delete API key',
      content: 'Are you sure you want to delete this API key? This action cannot be undone.',
      onOk: async () => {
        try {
          await deleteApiKeyMutation.mutateAsync(id);
          openInfoMessage('API key deleted');
        } catch (error) {
          console.error('Failed to delete API key:', error);
          openErrorMessage('Failed to delete API key');
        }
      }
    });
  });

  const handleCopyApiKey = useMemoizedFn(() => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      openInfoMessage('API key copied to clipboard');
    }
  });

  const handleCloseModal = useMemoizedFn(() => {
    setNewApiKey(null);
  });

  return (
    <div className="mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div />
        <Button
          variant="ghost"
          prefix={<Plus />}
          onClick={handleCreateApiKey}
          loading={createApiKeyMutation.isPending}>
          Create New API Key
        </Button>
      </div>

      {isLoading ? (
        <ApiKeysLoading />
      ) : (
        <div className="space-y-2">
          {apiKeys?.api_keys?.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No API keys found</div>
          ) : (
            apiKeys?.api_keys?.map((apiKey) => (
              <ApiKeyListItem key={apiKey.id} apiKey={apiKey} onDelete={handleDeleteApiKey} />
            ))
          )}
        </div>
      )}

      <ApiKeyCreatedModal apiKey={newApiKey} onCopy={handleCopyApiKey} onClose={handleCloseModal} />
    </div>
  );
};

ApiKeysController.displayName = 'ApiKeysController';
