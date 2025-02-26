import { AppContentHeader } from '@/app/app/_components/AppContentHeader';
import { BreadcrumbSeperator } from '@/components';
import { Breadcrumb } from 'antd';
import { type ApiSessionWithTraces } from 'langfuse';
import React from 'react';

export const TracesHeader = React.memo(({ trace }: { trace: ApiSessionWithTraces | undefined }) => {
  const traceTitle = trace?.id;

  const items = [
    {
      title: 'Traces'
    },
    {
      title: traceTitle
    }
  ].filter((item) => item.title);

  return (
    <AppContentHeader>
      <Breadcrumb items={items} separator={<BreadcrumbSeperator />} />
    </AppContentHeader>
  );
});

TracesHeader.displayName = 'TracesHeader';
