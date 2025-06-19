'use client';

import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { ReasoningController } from '@/controllers/ReasoningController';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';

export default function Page(params: { params: { chatId: string } }) {
  const selectedFileId = useChatIndividualContextSelector((x) => x.selectedFileId);
  const selectedFileType = useChatIndividualContextSelector((x) => x.selectedFileType);

  if (selectedFileId && selectedFileType === 'reasoning') {
    return <ReasoningController chatId={params.params.chatId} messageId={selectedFileId} />;
  }

  return (
    <>
      <div className="animate-in fade-in hidden delay-300 duration-500">
        <FileIndeterminateLoader />
      </div>
    </>
  );
}
