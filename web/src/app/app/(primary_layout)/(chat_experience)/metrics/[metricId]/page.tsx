'use server';

import { BusterRoutes, createBusterRoute } from '@/routes';
import { redirect } from 'next/navigation';

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
