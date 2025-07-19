import dynamic from 'next/dynamic';
import { CircleSpinnerLoaderContainer } from '../loaders';

export const BusterChartJSDynamic = dynamic(
  () => import('./BusterChartJS/BusterChartJS').then((mod) => ({ default: mod.BusterChartJS })),
  {
    ssr: false,
    loading: () => <CircleSpinnerLoaderContainer />
  }
);
