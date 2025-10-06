import type { MessageAnalysisMode } from '@buster/server-shared/chats';
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/buttons';
import { ArrowUp, Magnifier, Sparkle2 } from '@/components/ui/icons';
import Atom from '@/components/ui/icons/NucleoIconOutlined/atom';
import Microphone from '@/components/ui/icons/NucleoIconOutlined/microphone';
import type { MentionOnChangeFn } from '@/components/ui/inputs/MentionInput';
import {
  useMentionInputHasValue,
  useMentionInputSuggestionsGetValue,
  useMentionInputSuggestionsOnChangeValue,
} from '@/components/ui/inputs/MentionInputSuggestions';
import { Popover } from '@/components/ui/popover';
import { AppSegmented, type AppSegmentedProps } from '@/components/ui/segmented';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

type BusterChatInputButtons = {
  onSubmit: MentionOnChangeFn;
  onStop: () => void;
  submitting: boolean;
  disabled: boolean;
  mode: MessageAnalysisMode;
  onModeChange: (mode: MessageAnalysisMode) => void;
  onDictate?: (transcript: string) => void;
  onDictateListeningChange?: (listening: boolean) => void;
};

export const BusterChatInputButtons = React.memo(
  ({
    onSubmit,
    onStop,
    submitting,
    disabled,
    mode,
    onModeChange,
    onDictate,
    onDictateListeningChange,
  }: BusterChatInputButtons) => {
    const {
      transcript,
      listening,
      browserSupportsSpeechRecognition,
      onStartListening,
      onStopListening,
      hasPermission,
    } = useSpeechRecognition();
    const hasValue = useMentionInputHasValue();
    const onChangeValue = useMentionInputSuggestionsOnChangeValue();
    const getValue = useMentionInputSuggestionsGetValue();

    const disableSubmit = !hasValue;

    useEffect(() => {
      if (listening && transcript) {
        onDictate?.(transcript);
        onChangeValue(transcript);
      }
    }, [listening, transcript, onDictate, onChangeValue]);

    useEffect(() => {
      onDictateListeningChange?.(listening);
    }, [listening, onDictateListeningChange]);

    return (
      <div className="flex justify-between items-center gap-2">
        <AppSegmented
          size="medium"
          value={mode}
          options={modesOptions}
          onChange={(v) => onModeChange(v.value)}
        />

        <div className="flex items-center gap-2">
          {browserSupportsSpeechRecognition && (
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
                disabled={disabled}
                size={'tall'}
                className={cn(
                  'origin-center transform-gpu transition-all duration-300 ease-out will-change-transform text-text-secondary',
                  !disabled && 'hover:scale-110 active:scale-95',
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
          )}
          <AppTooltip
            delayDuration={disableSubmit ? 500 : 0}
            title={disableSubmit ? 'Please type something...' : submitting ? null : 'Submit'}
          >
            <Button
              rounding={'large'}
              variant={'black'}
              size={'tall'}
              prefix={<ArrowUp />}
              onClick={
                submitting
                  ? onStop
                  : () => {
                      const value = getValue?.();
                      if (!value) {
                        console.warn('Value is not defined');
                        return;
                      }
                      onSubmit(value);
                    }
              }
              loading={submitting}
              disabled={disabled || disableSubmit}
              className={cn(
                'origin-center transform-gpu transition-all duration-300 ease-out will-change-transform',
                !disabled && 'hover:scale-110 active:scale-95'
              )}
            />
          </AppTooltip>
        </div>
      </div>
    );
  }
);

BusterChatInputButtons.displayName = 'BusterChatInputButtons';

const ModePopoverContent = ({
  title,
  description,
  icon,
  iconText,
  content,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconText: string;
  content: string;
  children: React.ReactNode;
}) => {
  const classes = 'px-3';
  return (
    <Popover
      trigger="hover"
      side="bottom"
      sideOffset={10}
      className="p-0"
      onOpenAutoFocus={(e) => e.preventDefault()}
      content={
        <div className={cn('flex flex-col space-y-3 max-w-[210px] py-3')}>
          <div className={cn('flex flex-col space-y-1', classes)}>
            <Text>{title}</Text>
            <Text variant="secondary">{description}</Text>
          </div>
          <div className="border-t" />
          <div className={cn('flex flex-col space-y-1', classes)}>
            <div className="flex items-center gap-1 bg-item-select rounded px-1 h-4.5 w-fit text-sm text-gray-dark">
              {icon}
              <Text variant={'secondary'} size={'sm'}>
                {iconText}
              </Text>
            </div>
            <Text variant="secondary">{content}</Text>
          </div>
        </div>
      }
    >
      {children}
    </Popover>
  );
};

const modesOptions: AppSegmentedProps<MessageAnalysisMode>['options'] = [
  {
    icon: (
      <ModePopoverContent
        title="Auto"
        description="Decides how long to think"
        icon={<Sparkle2 />}
        iconText="Auto Mode"
        content={`Dynamically picks between Research and Deep Research modes`}
      >
        <Sparkle2 />
      </ModePopoverContent>
    ),
    value: 'auto' as const,
  },
  {
    icon: (
      <ModePopoverContent
        title="Research"
        description="Responds in 1-3 minutes"
        icon={<Magnifier />}
        iconText="Research Mode"
        content={`In-depth exploration for ad-hoc charts, dashboards, or reports`}
      >
        <Magnifier />
      </ModePopoverContent>
    ),
    value: 'standard' as const,
  },
  {
    icon: (
      <ModePopoverContent
        title="Deep Research"
        description="Responds in 3-8 minutes"
        icon={<Atom />}
        iconText="Deep Research Mode"
        content={`Generate robust reports with extremely thorough analysis`}
      >
        <Atom />
      </ModePopoverContent>
    ),
    value: 'investigation' as const,
  },
];
