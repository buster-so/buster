'use client';

import pluralize from 'pluralize';
import React, { useEffect, useMemo, useState } from 'react';
import { SyntaxHighlighter } from '@/components/ui/typography/SyntaxHighlight';
import { Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { FileCard } from '../../card/FileCard';
import { Button } from '../../buttons';
import { Copy2 } from '../../icons';
import { useMemoizedFn } from '../../../../hooks';
import { useBusterNotifications } from '../../../../context/BusterNotifications';

type LineSegment = {
  type: 'text' | 'hidden';
  content: string;
  lineNumber: number;
  numberOfLines?: number;
};

export const StreamingMessageCode: React.FC<{
  isStreamFinished: boolean;
  collapsible?: 'chevron' | 'overlay-peek' | false;
  buttons?: React.ReactNode | null;
  fileName: string | React.ReactNode | null;
  text: string;
  modified?: [number, number][];
}> = React.memo(({ isStreamFinished, fileName, buttons, collapsible = false, text, modified }) => {
  const [lineSegments, setLineSegments] = useState<LineSegment[]>([]);
  const { openSuccessMessage } = useBusterNotifications();

  const copyToClipboard = useMemoizedFn(() => {
    navigator.clipboard.writeText(text);
    openSuccessMessage('Copied to clipboard');
  });

  const buttonComponent = useMemo(() => {
    if (buttons === null) {
      return null;
    }

    if (!buttons) {
      return (
        <div className="flex justify-end">
          <Button prefix={<Copy2 />} variant="ghost" onClick={copyToClipboard}>
            Copy
          </Button>
        </div>
      );
    }
    return buttons;
  }, [buttons]);

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

  return (
    <FileCard collapsible={collapsible} fileName={fileName} headerButtons={buttonComponent}>
      <div className="w-full overflow-x-auto p-3">
        {lineSegments.map((segment, index) => (
          <div
            key={`${segment.lineNumber}-${index}`}
            className={cn('line-number pr-1', !isStreamFinished && 'fade-in duration-500')}>
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
});

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
