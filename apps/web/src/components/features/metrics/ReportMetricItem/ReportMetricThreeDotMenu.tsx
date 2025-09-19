import type { TElement } from 'platejs';
import { type PlateEditor, useEditorRef, useElement } from 'platejs/react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/buttons';
import {
  createDropdownItem,
  Dropdown,
  type IDropdownItem,
  type IDropdownItems,
} from '@/components/ui/dropdown';
import { Dots, Trash } from '@/components/ui/icons';
import { MetricHeaderSecondaryWrapperDropdown } from '../MetricHeaderSecondaryWrapper';
import {
  useDownloadMetricDataCSV,
  useDownloadPNGSelectMenu,
  useNavigatetoMetricItem,
  useOpenChartItem,
  useRenameMetricOnPage,
} from '../threeDotMenuHooks';

export const ReportMetricThreeDotMenu = ({
  metricId,
  metricVersionNumber,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
}) => {
  const items = useReportMetricThreeDotMenu({ metricId, metricVersionNumber });

  return <MetricHeaderSecondaryWrapperDropdown dropdownItems={items} />;
};

const useReportMetricThreeDotMenu = ({
  metricId,
  metricVersionNumber,
  cacheId,
}: {
  metricId: string;
  metricVersionNumber: number | undefined;
  cacheId?: string;
}): IDropdownItems => {
  const editor = useEditorRef();
  const element = useElement();

  const openChartItem = useOpenChartItem({
    metricId,
    metricVersionNumber,
  });
  const removeFromReportItem = useRemoveFromReportItem({
    editor,
    element,
  });
  const navigateToMetricItem = useNavigatetoMetricItem({
    metricId,
    metricVersionNumber,
  });
  const downloadCSV = useDownloadMetricDataCSV({ metricId, metricVersionNumber, cacheId });
  const downloadPNG = useDownloadPNGSelectMenu({ metricId, metricVersionNumber });
  const renameMetric = useRenameMetricOnPage({
    metricId,
    metricVersionNumber,
    isNotMetricPage: true,
  });

  return useMemo(
    () => [
      openChartItem,
      removeFromReportItem,
      { type: 'divider' },
      ...navigateToMetricItem,
      { type: 'divider' },
      downloadCSV,
      downloadPNG,
      { type: 'divider' },
      renameMetric,
    ],
    [
      openChartItem,
      removeFromReportItem,
      navigateToMetricItem,
      downloadCSV,
      downloadPNG,
      renameMetric,
    ]
  );
};

const useRemoveFromReportItem = ({
  editor,
  element,
}: {
  editor: PlateEditor;
  element: TElement;
}): IDropdownItem => {
  return useMemo(
    () =>
      createDropdownItem({
        value: 'remove-from-report',
        label: 'Remove from report',
        icon: <Trash />,
        onClick: () => {
          const path = editor.api.findPath(element);
          editor.tf.removeNodes({ at: path });
        },
      }),
    []
  );
};
