'use client';

import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { ReasoningController } from '@/controllers/ReasoningController';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { use } from 'react';

export default function Page(props: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(props.params);
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);

  if (selectedFileId && selectedFileType === 'reasoning') {
    return <ReasoningController chatId={chatId} messageId={selectedFileId} />;
  }

  return (
    <>
      <div className="animate-in fade-in hidden delay-300 duration-500">
        <FileIndeterminateLoader />
      </div>
    </>
  );
}
