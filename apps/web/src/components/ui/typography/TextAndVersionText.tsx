import React from 'react';
import { Text } from './Text';

export const TextAndVersionText = React.memo(
  ({ text, version }: { text: string; version: number }) => {
    return (
      <div className="flex w-full justify-between space-x-1.5 overflow-hidden">
        <Text size={'base'} truncate>
          {text}
        </Text>
        <Text size={'sm'} variant={'secondary'}>
          {`Version ${version}`}
        </Text>
      </div>
    );
  }
);

TextAndVersionText.displayName = 'TextAndVersionText';
