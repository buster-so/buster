'use client';

import { queryKeys } from '@/api/query_keys';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { BarContainer } from './BarContainer';

export const BlackBoxMessage: React.FC<{ blackBoxMessage: string | undefined | null }> = React.memo(
  ({ blackBoxMessage }) => {
    if (blackBoxMessage) {
      return (
        <BarContainer
          showBar={false}
          status={'loading'}
          isCompletedStream={false}
          title={blackBoxMessage}
          secondaryTitle={''}
        />
      );
    }

    return null;
  }
);

BlackBoxMessage.displayName = 'BlackBoxMessage';
