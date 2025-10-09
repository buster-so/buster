import { useQuery } from '@tanstack/react-query';
import React, { useRef } from 'react';
import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { useTrackAndUpdateReportChanges } from '@/api/buster-electric/reports/hooks';
import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import type { IReportEditor } from '@/components/ui/report/ReportEditor';
import { ReportEditorSkeleton } from '@/components/ui/report/ReportEditorSkeleton';
import type { BusterReportEditor } from '@/components/ui/report/types';
import { useGetScrollAreaRef } from '@/components/ui/scroll-area/useGetScrollAreaRef';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useEditorContext } from '@/layouts/AssetContainer/ReportAssetContainer';
import { cn } from '@/lib/utils';
import { chatQueryKeys } from '../../api/query_keys/chat';
import { useGetCurrentMessageId, useIsStreamingMessage } from '../../context/Chats';
import { GeneratingContent } from './GeneratingContent';
import { ReportPageHeader } from './ReportPageHeader';

const commonClassName = 'sm:px-[max(64px,calc(50%-350px))] px-[max(24px,calc(50%-350px))]';

export const ReportPageController: React.FC<{
  reportId: string;
  readOnly?: boolean;
  className?: string;
  onReady?: (editor: IReportEditor) => void;
  mode?: 'default' | 'export';
}> = React.memo(
  ({ reportId, readOnly = false, className = '', onReady: onReadyProp, mode = 'default' }) => {
    const { data: report } = useGetReport({ id: reportId, versionNumber: undefined });
    const { setEditor } = useEditorContext();
    const isStreamingMessage = useIsStreamingMessage();
    const messageId = useGetCurrentMessageId();

    // Fetch the current message to check which files are being generated
    const { data: currentMessage } = useQuery<BusterChatMessage>({
      ...chatQueryKeys.chatsMessages(messageId || ''),
      enabled: !!messageId && isStreamingMessage,
    });

    // Check if this specific report is being generated in the current message
    const isThisReportBeingGenerated = React.useMemo(() => {
      if (!currentMessage || !isStreamingMessage || !messageId) return false;

      // Check if the current report ID matches any file being generated
      const responseMessages = Object.values(currentMessage.response_messages || {});
      return responseMessages.some(
        (msg) => msg.type === 'file' && msg.file_type === 'report_file' && msg.id === reportId
      );
    }, [currentMessage, isStreamingMessage, messageId, reportId]);

    const content = report?.content || '';
    const showGeneratingContent = isThisReportBeingGenerated;

    const { mutate: updateReport } = useUpdateReport();

    const canUpdate = () => {
      if (isStreamingMessage || !report || readOnly) {
        console.warn('Cannot update report');
        return false;
      }
      return true;
    };

    const onChangeName = useMemoizedFn((name: string) => {
      if (!canUpdate()) {
        return;
      }
      updateReport({ reportId, name });
    });

    const onChangeContent = useMemoizedFn((content: string) => {
      if (!canUpdate()) {
        return;
      }
      updateReport({ reportId, content });
    });

    const onReady = useMemoizedFn((editor: BusterReportEditor) => {
      setEditor?.(editor);
      onReadyProp?.(editor);
    });

    useTrackAndUpdateReportChanges({ reportId, subscribe: isStreamingMessage });

    const nodeRef = useRef<HTMLDivElement>(null);
    const { scrollAreaRef } = useGetScrollAreaRef({ nodeRef });

    return (
      <div
        id="report-page-controller"
        ref={nodeRef}
        className={cn('relative h-full space-y-1.5 overflow-hidden', className)}
      >
        {report ? (
          <DynamicReportEditor
            key={reportId}
            value={content}
            placeholder="Start typing..."
            className={commonClassName}
            containerClassName="mt-9"
            variant="default"
            useFixedToolbarKit={false}
            onValueChange={onChangeContent}
            readOnly={readOnly || !report}
            mode={mode}
            onReady={onReady}
            isStreaming={isStreamingMessage}
            scrollAreaRef={scrollAreaRef}
            preEditorChildren={
              <ReportPageHeader
                name={report?.name}
                updatedAt={report?.updated_at}
                onChangeName={onChangeName}
                className={commonClassName}
                isStreaming={isStreamingMessage}
                readOnly={readOnly}
              />
            }
            postEditorChildren={
              <GeneratingContent
                messageId={messageId || ''}
                className={commonClassName}
                show={showGeneratingContent}
              />
            }
          />
        ) : (
          <ReportEditorSkeleton className={commonClassName} />
        )}
      </div>
    );
  }
);

ReportPageController.displayName = 'ReportPageController';
