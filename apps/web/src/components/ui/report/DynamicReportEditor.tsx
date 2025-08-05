import dynamic from 'next/dynamic';
import { ReportEditorSkeleton } from './ReportEditorSkeleton';

export const DynamicReportEditor = dynamic(
  () => import('@/components/ui/report/ReportEditor').then((mod) => mod.ReportEditor),
  {
    ssr: false,
    loading: () => <ReportEditorSkeleton />
  }
);

export default DynamicReportEditor;
