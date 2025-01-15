import React from 'react';
import { Skeleton } from 'antd';

export const ApiKeysLoading: React.FC = () => {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((key) => (
        <div
          key={key}
          className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3">
          <div className="flex-1">
            <Skeleton active paragraph={{ rows: 1 }} className="mr-8" />
          </div>
          <div className="w-24">
            <Skeleton.Button active size="small" />
          </div>
        </div>
      ))}
    </div>
  );
};
