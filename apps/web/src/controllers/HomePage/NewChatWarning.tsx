import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/buttons';
import { ArrowUpRight, CircleCheck } from '@/components/ui/icons';
import { Paragraph, Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import type { useNewChatWarning } from './useNewChatWarning';

export const NewChatWarning = React.memo(
  ({ hasDatasets, hasDatasources }: ReturnType<typeof useNewChatWarning>) => {
    const allCompleted = hasDatasets && hasDatasources;
    const progress = [hasDatasources, hasDatasets].filter(Boolean).length;
    const progressPercentage = (progress / 2) * 100;

    return (
      <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <Text className="text-xl font-medium text-gray-800">Setup Checklist</Text>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-500">{progress}/2 completed</div>
            <div className="h-2 w-20 rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-purple-500 transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <Paragraph className="mb-4 text-sm text-gray-500">
          In order to ask questions, you need to connect a data source and create a dataset.
        </Paragraph>

        <div className="space-y-4">
          <SetupItem
            number="1"
            status={hasDatasources}
            title="Connect a Data Source"
            description="Link files, databases, or websites to enable knowledge retrieval"
            link="https://docs.buster.so/docs/using-the-cli/init-command"
            linkText="Go to docs"
          />

          <SetupItem
            number="2"
            status={hasDatasets}
            title="Create a Dataset"
            description="Organize your information for efficient querying"
            link="https://docs.buster.so/docs/using-the-cli/create-dataset"
            linkText="Go to docs"
          />
        </div>

        <div
          className={cn(
            'mt-5 flex items-center rounded-lg border p-4',
            allCompleted ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-50'
          )}>
          <div
            className={cn(
              'mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
              allCompleted ? 'bg-gray-200' : 'bg-gray-200'
            )}>
            {allCompleted ? (
              <CircleCheck fill="#4B5563" title="Complete" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-gray-400" />
            )}
          </div>
          <div>
            <Text className="font-medium text-gray-700">
              {allCompleted
                ? "You're all set! Ask questions to get answers from your data."
                : 'Complete both steps to start querying your information.'}
            </Text>
            <Text className="text-sm text-gray-500">
              {allCompleted
                ? ' Your data is ready to be explored.'
                : " Without proper setup, we can't retrieve your data."}
            </Text>
          </div>
        </div>
      </div>
    );
  }
);

NewChatWarning.displayName = 'NewChatWarning';

interface SetupItemProps {
  number: string;
  status: boolean;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

const SetupItem = ({ number, status, title, description, link, linkText }: SetupItemProps) => {
  return (
    <div
      className={cn(
        'group relative flex items-start space-x-4 rounded-lg border p-4 transition-all duration-200 hover:shadow-sm',
        status ? 'border-purple-700/30 bg-purple-50' : 'border-gray-200'
      )}>
      <div
        className={cn(
          'text-md flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-medium',
          status ? 'bg-purple-200/60 text-purple-700' : 'bg-gray-100 text-gray-500'
        )}>
        {status ? <CircleCheck title="Complete" /> : number}
      </div>

      <div className="min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Text className="font-medium text-gray-800">{title}</Text>
          {status && (
            <span className="rounded-full bg-purple-200/60 px-2 py-1 text-xs font-medium text-purple-700">
              Complete
            </span>
          )}
        </div>

        <Paragraph className="mt-1 text-sm text-gray-600">{description}</Paragraph>

        {link && (
          <Link href={link} target="_blank">
            <Button
              className="mt-2 text-sm"
              size="tall"
              suffix={
                <span className="text-xs">
                  <ArrowUpRight />
                </span>
              }>
              {linkText}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
