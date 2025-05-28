import { CircleQuestion } from '@/components/ui/icons';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import type React from 'react';

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
