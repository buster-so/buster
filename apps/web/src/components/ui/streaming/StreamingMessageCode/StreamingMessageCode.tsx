'use client';

import pluralize from 'pluralize';
import React, { useEffect, useMemo, useState } from 'react';
import { SyntaxHighlighter } from '@/components/ui/typography/SyntaxHighlight';
import type { BusterChatMessageReasoning_file } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { FileCard } from '../../card/FileCard';
import { TextAndVersionPill } from '../../typography/TextAndVersionPill';

type LineSegment = {
  type: 'text' | 'hidden';
  content: string;
  lineNumber: number;
  numberOfLines?: number;
};

export const StreamingMessageCode: React.FC<
  BusterChatMessageReasoning_file & {
    isCompletedStream: boolean;
    collapsible?: 'chevron' | 'overlay-peek' | false;
    buttons?: React.ReactNode;
  }
> = React.memo(
  ({
    isCompletedStream,
    file,
    file_type,
    file_name,
    version_number,
    buttons,
    collapsible = false
  }) => {
    const { text = '', modified } = file;

    const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);

    useEffect(() => {
      const processText = () => {
        // Split the text into lines, keeping empty lines
        const lines = (text || '').split('\n');
        const segments: LineSegment[] = [];
        let currentLine = 1;

        if (!modified || modified.length === 0) {
          for (const line of lines) {
            segments.push({
              type: 'text',
              content: line,
              lineNumber: currentLine++
            });
          }
        } else {
          // Sort modified ranges to ensure proper processing
          const sortedModified = [...modified].sort((a, b) => a[0] - b[0]);

          let lastEnd = 0;
          for (const [start, end] of sortedModified) {
            // Add visible lines before the hidden section
            for (let i = lastEnd; i < start - 1; i++) {
              segments.push({
                type: 'text',
                content: lines[i],
                lineNumber: currentLine++
              });
            }

            // Add hidden section
            const hiddenLineCount = end - start + 1;
            segments.push({
              type: 'hidden',
              content: '',
              lineNumber: currentLine,
              numberOfLines: hiddenLineCount
            });
            currentLine += hiddenLineCount;
            lastEnd = end;
          }

          // Add remaining visible lines after the last hidden section
          for (let i = lastEnd; i < lines.length; i++) {
            segments.push({
              type: 'text',
              content: lines[i],
              lineNumber: currentLine++
            });
          }
        }

        setLineSegments(segments);
      };

      processText();
    }, [text, modified]);

    const fileInfo = useMemo(() => {
      if (file_type === 'dashboard' || file_type === 'metric') {
        return <TextAndVersionPill fileName={file_name} versionNumber={version_number} />;
      }

      return <Text>{file_name}</Text>;
    }, [file_name, version_number]);

    return (
      <FileCard collapsible={collapsible} fileName={fileInfo} headerButtons={buttons}>
        <div className="w-full overflow-x-auto p-3">
          {lineSegments.map((segment, index) => (
            <div
              key={`${segment.lineNumber}-${index}`}
              className={cn('line-number pr-1', !isCompletedStream && 'fade-in duration-500')}>
              {segment.type === 'text' ? (
                <MemoizedSyntaxHighlighter lineNumber={segment.lineNumber} text={segment.content} />
              ) : (
                <HiddenSection numberOfLinesUnmodified={segment.numberOfLines || 0} />
              )}
            </div>
          ))}
        </div>
      </FileCard>
    );
  }
);

StreamingMessageCode.displayName = 'StreamingMessageCode';

const HiddenSection: React.FC<{
  numberOfLinesUnmodified: number;
}> = ({ numberOfLinesUnmodified }) => (
  <div className="my-2! flex w-full items-center space-x-1 first:mt-0">
    <div className="bg-border h-[0.5px] w-full" />
    <Text variant="tertiary" size={'xs'} className="whitespace-nowrap">
      {`${numberOfLinesUnmodified} ${pluralize('line', numberOfLinesUnmodified)} unmodified`}
    </Text>
    <div className="bg-border h-[0.5px] w-4" />
  </div>
);

const lineNumberStyles: React.CSSProperties = {
  minWidth: '2.25em'
};
const MemoizedSyntaxHighlighter = React.memo(
  ({ lineNumber, text }: { lineNumber: number; text: string }) => {
    return (
      <SyntaxHighlighter
        language={'yaml'}
        showLineNumbers
        startingLineNumber={lineNumber}
        lineNumberStyle={lineNumberStyles}
        lineNumberContainerStyle={{ color: 'red' }}
        className={'m-0! w-fit! border-none! p-0!'}>
        {text}
      </SyntaxHighlighter>
    );
  }
);

MemoizedSyntaxHighlighter.displayName = 'MemoizedSyntaxHighlighter';
