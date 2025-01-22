import { ColumnMetaData, IBusterThreadMessageChartConfig } from '@/api/buster_rest';
import { formatLabel } from '@/utils';
import { ColumnTypeIcon } from '../SelectAxis/config';

export const createColumnFieldOptions = (
  columnMetadata: ColumnMetaData[],
  columnLabelFormats: IBusterThreadMessageChartConfig['columnLabelFormats'],
  iconClass: string
) => {
  return columnMetadata.map((column) => {
    const labelFormat = columnLabelFormats[column.name];
    const formattedLabel = formatLabel(column.name, labelFormat, true);
    const Icon = ColumnTypeIcon[labelFormat.style];

    return {
      label: (
        <div className="flex w-full items-center space-x-1.5 overflow-hidden">
          <div className={`${iconClass} flex`}>{Icon.icon}</div>
          <span className="truncate">{formattedLabel}</span>
        </div>
      ),
      value: column.name
    };
  });
};
