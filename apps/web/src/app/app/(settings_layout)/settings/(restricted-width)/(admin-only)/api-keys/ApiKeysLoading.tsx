import type React from 'react';

export const ApiKeysLoading: React.FC = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3">
          <div className="flex-1">
            <div className="mr-8 h-4 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="w-24">
            <div className="h-8 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
};
