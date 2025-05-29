import React from 'react';
import { Text } from '@/components/ui/typography';

export const AIWarning = React.memo(
  () => {
    return (
      <div className="w-full truncate overflow-hidden text-center">
        <Text size="xs" variant="tertiary" truncate>
          Our AI may make mistakes. Check important info.
        </Text>
      </div>
    );
  },
  () => true
);

AIWarning.displayName = 'AIWarning';
