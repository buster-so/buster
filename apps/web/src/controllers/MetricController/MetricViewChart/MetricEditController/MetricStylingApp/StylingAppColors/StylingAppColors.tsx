import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { useUpdateMetricChart } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { cn } from '@/lib/classMerge';
import { ColorsApp } from './ColorsApp';
import { CustomApp } from './CustomApp';
import { StylingAppColorsTab } from './config';
import { PaletteApp } from './PaletteApp';

export const StylingAppColors: React.FC<{
  className: string;
  colors: ChartConfigProps['colors'];
}> = React.memo(({ className, colors }) => {
  const [selectedTab, setSelectedTab] = useState<StylingAppColorsTab>(StylingAppColorsTab.Colors);

  const { onUpdateMetricChartConfig } = useUpdateMetricChart();

  const onUpdateChartConfig = useMemoizedFn((chartConfig: Partial<ChartConfigProps>) => {
    onUpdateMetricChartConfig({ chartConfig });
  });

  return (
    <div className="flex flex-col space-y-2">
      {/* <div className={className}>
        <SelectColorApp selectedTab={selectedTab} onChange={setSelectedTab} />
      </div> */}

      <div className={cn(className, 'mt-3 mb-12')}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.11 }}>
            {selectedTab === StylingAppColorsTab.Colors && (
              <ColorsApp colors={colors} onUpdateChartConfig={onUpdateChartConfig} />
            )}
            {selectedTab === StylingAppColorsTab.Palettes && <PaletteApp colors={colors} />}
            {selectedTab === StylingAppColorsTab.Custom && <CustomApp />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});

StylingAppColors.displayName = 'StylingAppColors';
