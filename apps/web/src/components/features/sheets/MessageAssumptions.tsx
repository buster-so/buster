import { Sheet } from '@/components/ui/sheet';
import React, { useMemo } from 'react';
import { Button, type ButtonProps } from '@/components/ui/buttons';
import { forwardRef, useImperativeHandle, useState } from 'react';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { AnimatePresence, motion } from 'framer-motion';
import { PostProcessingMessage, type ConfidenceScore } from '@buster/server-shared/message';
import { Title, Paragraph, Text } from '@/components/ui/typography';
import {
  assumptionClassificationTranslations,
  confidenceTranslations,
  assumptionLabelTranslations
} from '@/lib/messages/confidence-translations';
import { CircleCheck, OctagonWarning } from '@/components/ui/icons';
import { Pill } from '@/components/ui/pills/Pill';
import AppMarkdownStreaming from '@/components/ui/streaming/AppMarkdownStreaming/AppMarkdownStreaming';

type MessageAssumptionsProps = Pick<
  PostProcessingMessage,
  'summary_message' | 'summary_title' | 'assumptions' | 'confidence_score'
> & {
  useTrigger?: boolean;
};

export interface MessageAssumptionsRef {
  open: () => void;
  close: () => void;
}

export const MessageAssumptions = React.memo(
  forwardRef<MessageAssumptionsRef, MessageAssumptionsProps>(
    (
      { summary_message, useTrigger = true, summary_title, assumptions = [], confidence_score },
      ref
    ) => {
      const [open, setOpen] = useState(false);
      const [selectedPanel, setSelectedPanel] = useState<AssumptionType>(AssumptionType.SUMMARY);

      useImperativeHandle(ref, () => ({
        open: () => setOpen(true),
        close: () => setOpen(false)
      }));

      return (
        <Sheet
          contentClassName="w-[525px]"
          open={open}
          onOpenChange={setOpen}
          trigger={
            useTrigger ? (
              <Trigger onClick={() => setOpen(true)} confidence_score={confidence_score} />
            ) : null
          }
          header={
            <AssumptionHeader
              selected={selectedPanel}
              confidence_score={confidence_score}
              onChange={setSelectedPanel}
            />
          }>
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedPanel}
              initial={{ opacity: 0, filter: 'blur(1px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(1px)' }}
              transition={{ duration: 0.18 }}>
              <div className="px-9 pt-9 pb-4">
                {selectedPanel === AssumptionType.SUMMARY ? (
                  <AssumptionSummary
                    summary_message={summary_message}
                    summary_title={summary_title}
                    confidence_score={confidence_score}
                  />
                ) : (
                  <AssumptionList assumptions={assumptions} selectedPanel={selectedPanel} />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </Sheet>
      );
    }
  )
);

MessageAssumptions.displayName = 'MessageAssumptions';

enum AssumptionType {
  SUMMARY = 'summary',
  MAJOR = 'major',
  MINOR = 'minor'
}

const options: SegmentedItem<AssumptionType>[] = [
  {
    label: 'Summary',
    value: AssumptionType.SUMMARY
  },
  {
    label: 'Major',
    value: AssumptionType.MAJOR
  },
  {
    label: 'Minor',
    value: AssumptionType.MINOR
  }
];

const AssumptionHeader = ({
  selected,
  confidence_score,
  onChange
}: {
  selected: AssumptionType;
  onChange: (v: AssumptionType) => void;
  confidence_score: ConfidenceScore;
}) => {
  return (
    <div className="flex w-full justify-between space-x-3">
      <AppSegmented
        options={options}
        value={selected}
        type="button"
        onChange={(v) => {
          onChange(v.value);
        }}
      />
      <ConfidenceIndicator confidence_score={confidence_score} />
    </div>
  );
};

const AssumptionSummary = ({
  summary_message,
  summary_title,
  confidence_score
}: {
  summary_message: string;
  summary_title: string;
  confidence_score: ConfidenceScore;
}) => {
  return (
    <div className="">
      <div className="flex flex-col gap-y-0.5">
        <Text variant="secondary" size={'sm'}>
          {confidenceTranslations[confidence_score]}
        </Text>
        <Title as={'h3'} className="text-lg">
          {summary_title}
        </Title>
      </div>
      <AppMarkdownStreaming
        content={summary_message}
        isStreamFinished={true}
        stripFormatting={true}
        className="mt-2 text-text-secondary"
      />
    </div>
  );
};

const ConfidenceIndicator = ({ confidence_score }: { confidence_score: ConfidenceScore }) => {
  const variant: ButtonProps['variant'] = confidence_score === 'high' ? 'success' : 'danger';
  const label = confidenceTranslations[confidence_score];
  const icon = confidence_score === 'high' ? <CircleCheck /> : <OctagonWarning />;

  return (
    <div className="flex flex-col gap-y-0.5">
      <Button className="flex items-center gap-x-1" variant={variant} prefix={icon}>
        {label}
      </Button>
    </div>
  );
};

const AssumptionList = React.memo(
  ({
    assumptions,
    selectedPanel
  }: {
    selectedPanel: Exclude<AssumptionType, AssumptionType.SUMMARY>;
    assumptions: PostProcessingMessage['assumptions'];
  }) => {
    const selectedAssumptions = useMemo(() => {
      if (selectedPanel === AssumptionType.MAJOR) {
        return assumptions?.filter((a) => a.label === 'major') ?? [];
      }

      return assumptions?.filter((a) => a.label !== 'major') ?? [];
    }, [assumptions, selectedPanel]);

    const title = useMemo(() => {
      if (selectedPanel === AssumptionType.MAJOR) {
        return 'Major Assumptions';
      }
      if (selectedPanel === AssumptionType.MINOR) {
        return 'Minor Assumptions';
      }
    }, [selectedPanel]);

    const description = useMemo(() => {
      if (selectedPanel === AssumptionType.MAJOR) {
        return 'Buster’s work undergoes rigorous testing and evaluation. Below are major assumptions that were flagged and reported from our evaluations.';
      }
      if (selectedPanel === AssumptionType.MINOR) {
        return 'Buster’s work undergoes rigorous testing and evaluation. Below are minor assumptions that were flagged and reported from our evaluations.';
      }
      return '';
    }, [selectedPanel]);

    const hasAssumptions = selectedAssumptions.length > 0;

    const emptyState = useMemo(() => {
      if (hasAssumptions) {
        return false;
      }
      if (selectedPanel === AssumptionType.MAJOR) {
        return 'No major assumptions identified';
      }
      if (selectedPanel === AssumptionType.MINOR) {
        return 'No minor assumptions identified';
      }
    }, [selectedPanel]);

    return (
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-0.5">
          <Title as={'h4'} className="text-lg">
            {title}
          </Title>
          <Paragraph className="mt-2" variant={'secondary'}>
            {description}
          </Paragraph>
        </div>

        <div className="flex flex-col gap-y-3">
          {selectedAssumptions.map((assumption, index) => (
            <AssumptionCard key={index + selectedPanel} assumption={assumption} />
          ))}
          {emptyState && (
            <div className="flex flex-col items-center justify-center gap-y-2 rounded border p-3 text-center shadow">
              <Text variant="secondary" size={'sm'} className="text-gray-light">
                {emptyState}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MessageAssumptions.displayName = 'MessageAssumptions';
AssumptionList.displayName = 'AssumptionList';

const AssumptionCard = ({
  assumption
}: {
  assumption: NonNullable<PostProcessingMessage['assumptions']>[number];
}) => {
  const title = assumption.descriptive_title;
  const explanation = assumption.explanation;
  const classification = assumptionClassificationTranslations[assumption.classification];
  const label = assumptionLabelTranslations[assumption.label];
  const isMajor = assumption.label === 'major';

  return (
    <div className="flex flex-col rounded border shadow">
      <div className="flex flex-col gap-y-1.5 p-3">
        <Title as={'h4'} className="text-base">
          {title}
        </Title>
        <AppMarkdownStreaming
          content={explanation}
          isStreamFinished={true}
          stripFormatting={true}
          className="text-text-secondary text-sm"
        />
      </div>

      <div className="flex items-center justify-between border-t px-3.5 py-2">
        <Text variant="secondary">{classification}</Text>
        <Pill variant={isMajor ? 'danger' : 'gray'}>{label}</Pill>
      </div>
    </div>
  );
};

const Trigger: React.FC<{
  onClick: () => void;
  confidence_score: ConfidenceScore;
}> = React.memo(({ onClick, confidence_score }) => {
  const isLow = confidence_score === 'low' || !confidence_score;
  const icon = isLow ? <OctagonWarning /> : <CircleCheck />;

  return (
    <div
      className={
        'text-icon-color flex cursor-pointer items-center rounded-sm p-[3px] text-lg transition-colors'
      }
      onClick={onClick}>
      {icon}
    </div>
  );
});

Trigger.displayName = 'Trigger';
