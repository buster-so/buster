import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders/CircleSpinnerLoaderContainer';

export const loading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden">
      <CircleSpinnerLoaderContainer />
    </div>
  );
};
