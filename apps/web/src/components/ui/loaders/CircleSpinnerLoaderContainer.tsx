import type React from 'react';
import CircleSpinnerLoader from './CircleSpinnerLoader';

export const CircleSpinnerLoaderContainer: React.FC<{
  text?: string;
  className?: string;
}> = ({ className = '', text = '' }) => {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center ${className}`}>
      <CircleSpinnerLoader />
      {text && <span className="mt-3 text-base">{text}</span>}
    </div>
  );
};
