'use client';
import React, { use } from 'react';
import { permanentRedirect, RedirectType } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default function DashboardPage(
  props: {
    params: Promise<{ datasetId: string }>;
  }
) {
  const params = use(props.params);

  const {
    datasetId
  } = params;

  permanentRedirect(
    createBusterRoute({
      route: BusterRoutes.APP_DATASETS_ID_OVERVIEW,
      datasetId
    }),
    RedirectType.replace
  );

  return <></>;
}
