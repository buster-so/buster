import { IndeterminateLinearLoader } from '@/components/ui/loaders';
import type React from 'react';

export const FileIndeterminateLoader: React.FC = () => {
  return (
    <div className="relative z-10 h-0 overflow-visible">
      <IndeterminateLinearLoader
        className="absolute top-0 left-0 w-full"
        trackColor="transparent"
      />
    </div>
  );
};
