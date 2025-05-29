import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders';
import dynamic from 'next/dynamic';

const DynamicReactMarkdown = dynamic(() => import('./AppMarkdown'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[120px]">
      <CircleSpinnerLoaderContainer />
    </div>
  )
});

export const AppMarkdownDynamic = DynamicReactMarkdown;
