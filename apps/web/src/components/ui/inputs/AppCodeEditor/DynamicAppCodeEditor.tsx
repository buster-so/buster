import dynamic from 'next/dynamic';
import { CircleSpinnerLoaderContainer } from '../../loaders/CircleSpinnerLoaderContainer';

export const DynamicAppCodeEditor = dynamic(
  () => import('./AppCodeEditor').then((mod) => mod.AppCodeEditor),
  {
    ssr: false,
    loading: () => <CircleSpinnerLoaderContainer className="animate-in fade-in-0 duration-300" />
  }
);

export default DynamicAppCodeEditor;
