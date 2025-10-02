import {
  useEditorRef,
  useEditorSelector,
  useElement,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
} from 'platejs/react';
import * as React from 'react';
import { AddMetricModal } from '@/components/features/dashboard/AddMetricModal';
import { Button } from '@/components/ui/buttons';
import { PopoverAnchor, PopoverBase, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { NodeTypeIcons } from '../../config/icons';
import { MetricPlugin, type TMetricElement } from '../../plugins/metric-kit';
import { CaptionButton } from '../CaptionNode';

export function MetricToolbar({
  children,
  selectedMetricId,
}: {
  children: React.ReactNode;
  selectedMetricId?: string;
}) {
  const editor = useEditorRef();
  const readOnly = useReadOnly();
  const selected = useSelected();

  const selectionCollapsed = useEditorSelector((ed) => !ed.api.isExpanded(), []);
  const isOpen = !readOnly && selected && selectionCollapsed;

  const element = useElement<TMetricElement>();
  const plugin = editor.getPlugin(MetricPlugin);

  const { props: removeButtonProps } = useRemoveNodeButton({ element });

  const [openEditModal, setOpenEditModal] = React.useState(false);

  const preselectedMetrics = React.useMemo(() => {
    return selectedMetricId ? [{ id: selectedMetricId, name: '' }] : [];
  }, [selectedMetricId]);

  const onOpenEdit = React.useCallback(() => {
    editor.tf.select();
    setOpenEditModal(true);
  }, [editor]);

  const onCloseEdit = React.useCallback(() => {
    setOpenEditModal(false);
  }, []);

  const handleAddMetrics = React.useCallback(
    async (metrics: { id: string; name: string; versionNumber: number | undefined }[]) => {
      const id = metrics?.[0]?.id;
      const versionNumber = metrics?.[0]?.versionNumber;
      const at = editor.api.findPath(element);
      if (!id || !at) return onCloseEdit();
      plugin.api.metric.updateMetric(id, versionNumber, { at });
      onCloseEdit();
    },
    [editor, element, onCloseEdit, plugin.api.metric]
  );

  return (
    <PopoverBase open={isOpen} modal={false}>
      <PopoverAnchor>{children}</PopoverAnchor>

      <PopoverContent
        className="w-auto p-2"
        side="bottom"
        sideOffset={10}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="box-content flex items-center space-x-2">
          <CaptionButton />

          <Separator orientation="vertical" className=" h-6" />

          <Button prefix={<NodeTypeIcons.trash />} {...removeButtonProps}>
            Delete
          </Button>
        </div>
      </PopoverContent>

      {/* <AddMetricModal
        open={openEditModal}
        loading={false}
        initialSelectedMetrics={preselectedMetrics}
        onClose={onCloseEdit}
        onAddMetrics={handleAddMetrics}
        selectionMode="single"
        saveButtonText="Update metric"
      /> */}
    </PopoverBase>
  );
}
