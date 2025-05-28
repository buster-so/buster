import type React from 'react';
import { Text } from '@/components/ui/typography';
import { Check } from '@/components/ui/icons';

export const DropdownLabel: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle
}) => {
  return (
    <div className="dropdown-label flex space-x-2 py-1">
      <div className="flex flex-col space-y-0.5">
        <Text className="text-sm! font-normal!">{title}</Text>
        {subtitle && (
          <Text className="subtitle text-sm! font-normal!" variant="secondary">
            {subtitle}
          </Text>
        )}
      </div>

      <div className="check text-icon-color flex w-full flex-col items-end justify-center">
        <Check />
      </div>
    </div>
  );
};
