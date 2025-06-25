import { MetricListContainer } from '@/controllers/MetricListContainer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Metrics'
};

export default function MetricsPage() {
  return <MetricListContainer />;
}
