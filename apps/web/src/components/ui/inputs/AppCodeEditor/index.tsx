import dynamic from 'next/dynamic';
import { CircleSpinnerLoaderContainer } from '../../loaders';

export const AppCodeEditor = dynamic(
  () => import('./AppCodeEditor').then((mod) => mod.AppCodeEditor),
  {
    ssr: false,
    loading: () => <CircleSpinnerLoaderContainer />
  }
);
