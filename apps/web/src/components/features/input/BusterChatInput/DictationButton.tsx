import React, { useEffect } from 'react';
import { Button } from '@/components/ui/buttons';
import Microphone from '@/components/ui/icons/NucleoIconOutlined/microphone';
import { AppTooltip } from '@/components/ui/tooltip';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

export const DictationButton = React.memo(
  ({
    disableSubmit,
    onDictate,
    onChangeValue,
    onDictateListeningChange,
  }: {
    disableSubmit: boolean;
    onDictate: (transcript: string) => void;
    onChangeValue: (transcript: string) => void;
    onDictateListeningChange: (listening: boolean) => void;
  }) => {
    const { transcript, listening, isAvailable, onStartListening, onStopListening, hasPermission } =
      useSpeechRecognition();

    useEffect(() => {
      if (listening && transcript) {
        onDictate?.(transcript);
        onChangeValue(transcript);
      }
    }, [listening, transcript, onDictate, onChangeValue]);

    useEffect(() => {
      onDictateListeningChange?.(listening);
    }, [listening, onDictateListeningChange]);

    if (!isAvailable) return null;

    return (
      <AppTooltip
        title={
          listening
            ? !hasPermission
              ? 'Audio permissions not enabled'
              : 'Stop dictation...'
            : 'Press to dictate...'
        }
      >
        <Button
          rounding={'large'}
          variant={'ghost'}
          prefix={<Microphone />}
          onClick={listening ? onStopListening : onStartListening}
          size={'tall'}
          className={cn(
            'origin-center transform-gpu transition-all duration-300 ease-out will-change-transform text-text-secondary',
            !disableSubmit ? 'hover:scale-110 active:scale-95' : '',
            listening && 'bg-item-active shadow border text-foreground',
            listening && !hasPermission && 'bg-red-100! border border-red-300!'
          )}
          style={
            listening && !hasPermission
              ? ({
                  '--icon-color': 'var(--color-red-400)',
                } as React.CSSProperties)
              : {}
          }
        />
      </AppTooltip>
    );
  }
);

DictationButton.displayName = 'DictationButton';
