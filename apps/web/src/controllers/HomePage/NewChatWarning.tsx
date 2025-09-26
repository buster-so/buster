import type { UserOrganizationRole } from '@buster/server-shared/organization';
import { Link } from '@tanstack/react-router';
import React from 'react';
import { useListDatasources } from '@/api/buster_rest/data_source';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { Button } from '@/components/ui/buttons';
import { AlertWarning, ArrowUpRight, CircleCheck } from '@/components/ui/icons';
import { Paragraph, Text } from '@/components/ui/typography';
import { cn } from '@/lib/classMerge';
import { OrganizationUserRoleText } from '@/lib/organization/translations';
import type { useNewChatWarning } from './useNewChatWarning';

const translateRole = (role: UserOrganizationRole): string => {
  return OrganizationUserRoleText[role].title;
};

export const NewChatWarning = React.memo(
  ({ hasDatasets, hasDatasources, isAdmin, userRole }: ReturnType<typeof useNewChatWarning>) => {
    // If user is not an admin, show the contact admin card
    if (!isAdmin) {
      return <ContactAdminCard userRole={userRole} />;
    }

    // Admin users see the setup checklist
    const allCompleted = hasDatasets && hasDatasources;
    const progress = [hasDatasources, hasDatasets].filter(Boolean).length;
    const progressPercentage = (progress / 2) * 100;

    return (
      <div className="flex flex-col rounded border  bg-white p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <Text className="text-xl font-medium text-gray-800">Setup Checklist</Text>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-gray-500">{progress}/2 completed</div>
            <div className="h-2 w-20 rounded-full bg-item-hover">
              <div
                className="h-full rounded-full bg-gray-600 transition-all duration-500 ease-in-out"
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
            'mt-5 flex items-center rounded border p-4',
            allCompleted ? ' bg-gray-50' : ' bg-gray-50'
          )}
        >
          <div
            className={cn(
              'mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
              allCompleted ? 'bg-gray-200' : 'bg-gray-200'
            )}
          >
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
        'group relative flex items-start space-x-4 rounded border p-4 transition-all duration-200 hover:shadow-sm',
        status ? 'border-gray-400/30 bg-gray-50' : ''
      )}
    >
      <div
        className={cn(
          'text-md flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-medium',
          status ? 'bg-gray-200 text-gray-700' : 'bg-item-hover text-gray-500'
        )}
      >
        {status ? <CircleCheck title="Complete" /> : number}
      </div>

      <div className="min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between">
          <Text className="font-medium text-gray-800">{title}</Text>
          {status && (
            <span className="rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700">
              Complete
            </span>
          )}
        </div>

        <Paragraph className="mt-1 text-sm text-gray-600">{description}</Paragraph>

        {link && (
          <Link href={link} to="/" target="_blank">
            <Button
              className="mt-2 text-sm"
              size="tall"
              suffix={
                <span className="text-xs">
                  <ArrowUpRight />
                </span>
              }
            >
              {linkText}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

interface ResourceSectionProps {
  title: string;
  items?: Array<{ id: string; name: string }>;
  emptyMessage: string;
  pluralName: string;
}

const ResourceSection = ({ title, items, emptyMessage, pluralName }: ResourceSectionProps) => {
  const itemCount = items?.length || 0;

  return (
    <div className="rounded border  bg-gray-50 p-3">
      <div className="flex items-center justify-between mb-2">
        <Text className="text-sm font-medium text-gray-700">{title}</Text>
        <span className="rounded bg-item-select px-2 py-0.5 text-xs font-medium text-gray-600 border">
          {itemCount} available
        </span>
      </div>
      {items && items.length > 0 ? (
        <div className="space-y-1">
          {items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center text-sm text-gray-600">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-400 mr-2" />
              {item.name}
            </div>
          ))}
          {items.length > 3 && (
            <Text className="text-xs text-gray-500">
              +{items.length - 3} more {pluralName}
            </Text>
          )}
        </div>
      ) : (
        <Text className="text-sm text-gray-500">{emptyMessage}</Text>
      )}
    </div>
  );
};

interface ContactAdminCardProps {
  userRole?: UserOrganizationRole;
}

const ContactAdminCard = ({ userRole }: ContactAdminCardProps) => {
  const roleLabel = userRole ? translateRole(userRole) : 'User';
  const { data: datasets = [] } = useGetDatasets();
  const { data: datasources = [] } = useListDatasources();

  return (
    <div className="flex flex-col rounded border  bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <Text className="text-xl font-medium text-gray-800">Contact Admin Required</Text>
        <div className="rounded bg-item-hover px-3 py-1 border">
          <Text className="text-sm font-medium text-gray-700">{roleLabel}</Text>
        </div>
      </div>

      <Paragraph className="mb-4 text-sm text-gray-500">
        You don&apos;t have admin permissions to set up data sources and datasets.
      </Paragraph>

      <div className="space-y-4">
        <div className="rounded border  bg-gray-50 p-4">
          <div className="flex items-start space-x-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
              <Text className="text-sm font-medium text-gray-700">
                <AlertWarning />
              </Text>
            </div>
            <div className="min-w-0 flex-1">
              <Text className="font-medium text-gray-800">Permission Required</Text>
              <Paragraph className="mt-1 text-sm text-gray-700">
                Your current role is <span className="font-semibold">{roleLabel}</span>. To start
                asking questions, an admin needs to:
              </Paragraph>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
                <li>Connect data sources to your organization</li>
                <li>Create datasets from those data sources</li>
                <li>Grant you access to the relevant datasets</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Available Resources */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          <Paragraph className="text-sm font-medium text-gray-800">Your Current Access</Paragraph>

          <ResourceSection
            title="Datasets"
            items={datasets}
            emptyMessage="No datasets available"
            pluralName="datasets"
          />

          <ResourceSection
            title="Data Sources"
            items={datasources}
            emptyMessage="No data sources available"
            pluralName="data sources"
          />
        </div>
      </div>
    </div>
  );
};
