import React from 'react';
import type { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';

export const PaletteApp: React.FC<{
  colors: IBusterMetricChartConfig['colors'];
}> = React.memo(({ colors }) => {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <Text>Coming soon...</Text>
    </div>
  );
});
PaletteApp.displayName = 'PaletteApp';
