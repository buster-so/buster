import { IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import React, { useMemo } from 'react';
import { ThemeCarousel } from '../Common/ThemeCarousel';
import { Text } from '@/components/text';

export const PaletteApp: React.FC<{
  colors: IBusterThreadMessageChartConfig['colors'];
}> = React.memo(({ colors }) => {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Text>Coming soon...</Text>
    </div>
  );
});
PaletteApp.displayName = 'PaletteApp';
