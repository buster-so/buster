import { BusterAvatar, Text } from '@/components';
import React from 'react';

export const AppSidebarTopInternal = React.memo(
  ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
    return (
      <div className={className} style={style}>
        <div className="flex items-center gap-x-2">
          <BusterAvatar />
          <Text>Internal Toolkit</Text>
        </div>
      </div>
    );
  }
);

AppSidebarTopInternal.displayName = 'AppSidebarTopInternal';
