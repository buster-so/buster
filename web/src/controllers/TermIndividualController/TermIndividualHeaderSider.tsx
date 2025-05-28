import type React from 'react';
import { AppTooltip } from '@/components/ui/tooltip';
import { CircleQuestion } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';

export const TermIndividualHeaderSider: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-between">
      <Text>Details</Text>
      <div className="flex h-full items-center">
        <AppTooltip title="Edit">
          <Text className="flex h-full! cursor-pointer items-center text-lg">
            <CircleQuestion />
          </Text>
        </AppTooltip>
      </div>
    </div>
  );
};
