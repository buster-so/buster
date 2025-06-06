'use server';

import { redirect } from 'next/navigation';
import { BusterRoutes, createBusterRoute } from '@/routes';

export default async function MetricPage(props: { params: Promise<{ metricId: string }> }) {
  const params = await props.params;

  const { metricId } = params;

  return redirect(
    createBusterRoute({
      route: BusterRoutes.APP_METRIC_ID_CHART,
      metricId
    })
  );
}
