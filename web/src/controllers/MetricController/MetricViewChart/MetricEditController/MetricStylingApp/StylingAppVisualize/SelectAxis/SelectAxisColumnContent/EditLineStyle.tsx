import React, { useMemo } from 'react';
import { ENABLED_DOTS_ON_LINE_SIZE } from '@/api/asset_interfaces';
import type { BusterChartConfigProps, ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { ChartArea, ChartCombo, ChartLine, ChartStep } from '@/components/ui/icons';
import type { SegmentedItem } from '@/components/ui/segmented';
import { AppSegmented } from '@/components/ui/segmented';
import { AppTooltip } from '@/components/ui/tooltip';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../../../Common/LabelAndInput';

const options: { icon: React.ReactNode; value: LineValue }[] = [
  {
    icon: (
      <AppTooltip title="Area chart">
        <ChartArea />
      </AppTooltip>
    ),
    value: 'area'
  },
  {
    icon: (
      <AppTooltip title="Dots on line">
        <ChartCombo />
      </AppTooltip>
    ),
    value: 'dot-line'
  },
  {
    icon: (
      <AppTooltip title="Line chart">
        <ChartLine />
      </AppTooltip>
    ),
    value: 'line'
  },
  {
    icon: (
      <AppTooltip title="Step chart">
        <ChartStep />
      </AppTooltip>
    ),
    value: 'step'
  }
];

type LineValue = 'area' | 'dot-line' | 'line' | 'step';

export const EditLineStyle: React.FC<{
  selectedChartType: BusterChartConfigProps['selectedChartType'];
  lineStyle: Required<ColumnSettings>['lineStyle'];
  lineType: Required<ColumnSettings>['lineType'];
  lineSymbolSize: Required<ColumnSettings>['lineSymbolSize'];
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
}> = React.memo(
  ({ selectedChartType, lineStyle, lineType, lineSymbolSize, onUpdateColumnSettingConfig }) => {
    const isComboChart = selectedChartType === 'combo';

    const shownOptions = useMemo(() => {
      if (selectedChartType === 'line') return options.filter((x) => x.value !== 'area');
      return options;
    }, [selectedChartType]);

    const selectedOption: LineValue = useMemo(() => {
      if (lineStyle === 'area' && selectedChartType === 'combo') return 'area';
      if (lineType === 'step') return 'step';
      if (lineType === 'normal' && lineSymbolSize > 0) return 'dot-line';
      return 'line';
    }, [lineSymbolSize, lineStyle, selectedChartType, lineType]);

    const onClickValue = useMemoizedFn((value: string) => {
      const lineValue: LineValue = value as LineValue;

      const methodRecord: Record<LineValue, () => void> = {
        area: () => {
          onUpdateColumnSettingConfig({
            lineStyle: 'area',
            lineType: 'normal',
            lineSymbolSize: 0
          });
        },
        'dot-line': () => {
          const config: Partial<ColumnSettings> = {
            lineType: 'normal',
            lineSymbolSize: ENABLED_DOTS_ON_LINE_SIZE
          };
          if (isComboChart) config.lineStyle = 'line';
          onUpdateColumnSettingConfig(config);
        },
        line: () => {
          const config: Partial<ColumnSettings> = {
            lineType: 'normal',
            lineSymbolSize: 0
          };
          if (isComboChart) config.lineStyle = 'line';
          onUpdateColumnSettingConfig(config);
        },
        step: () => {
          const config: Partial<ColumnSettings> = {
            lineType: 'step',
            lineSymbolSize: 0
          };
          if (isComboChart) config.lineStyle = 'line';
          onUpdateColumnSettingConfig(config);
        }
      };

      methodRecord[lineValue]();
    });

    const onChange = useMemoizedFn((value: SegmentedItem) => {
      if (value?.value) onClickValue(value.value);
    });

    return (
      <LabelAndInput label="Line settings">
        <div className="flex justify-end">
          <AppSegmented
            options={shownOptions}
            value={selectedOption}
            onChange={onChange}
            type="button"
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditLineStyle.displayName = 'EditLineStyle';
