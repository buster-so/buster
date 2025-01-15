import React, { useMemo } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { BusterChartConfigProps, ColumnSettings } from '@/components/charts';
import { AppMaterialIcons, AppSegmented } from '@/components';
import { SegmentedProps } from 'antd';
import { useEditAppSegmented } from './useEditAppSegmented';
import { ENABLED_DOTS_ON_LINE_SIZE } from '@/api/buster-rest';
import { useMemoizedFn } from 'ahooks';
import { SegmentedValue } from 'antd/es/segmented';

const options: { icon: React.ReactNode; value: LineValue }[] = [
  { icon: <AppMaterialIcons icon="line_chart_area" data-value="area" />, value: 'area' },
  {
    icon: <AppMaterialIcons icon="line_chart_dot_line" data-value="dot-line" />,
    value: 'dot-line'
  },
  { icon: <AppMaterialIcons icon="show_chart" data-value="line" />, value: 'line' },
  { icon: <AppMaterialIcons icon="stairs" data-value="step" />, value: 'step' }
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

    const onChangeValue = useMemoizedFn((value: SegmentedValue) => {
      if (value) onClickValue(value as string);
    });

    const { onClick } = useEditAppSegmented({
      onClick: onClickValue
    });

    return (
      <LabelAndInput label="Line settings">
        <div className="flex justify-end">
          <AppSegmented
            options={shownOptions as SegmentedProps['options']}
            block={false}
            bordered={false}
            value={selectedOption}
            onClick={onClick}
            //  onChange={onChangeValue}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditLineStyle.displayName = 'EditLineStyle';
