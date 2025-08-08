import * as React from 'react';

import { useEditorRef, useEditorSelector, useElement, useReadOnly, useRemoveNodeButton, useSelected } from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import { PopoverBase, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { NodeTypeIcons } from '../../config/icons';
import { NodeTypeLabels } from '../../config/labels';
import { AddMetricModal } from '@/components/features/modal/AddMetricModal';
import { MetricPlugin, type TMetricElement } from '../../plugins/metric-plugin';

export function MetricToolbar({ children, selectedMetricId }: { children: React.ReactNode; selectedMetricId?: string }) {
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
    async (metrics: { id: string; name: string }[]) => {
      const id = metrics?.[0]?.id;
      const at = editor.api.findPath(element);
      if (!id || !at) return onCloseEdit();
      plugin.api.metric.updateMetric(id, { at });
      onCloseEdit();
    },
    [editor, element, onCloseEdit, plugin.api.metric]
  );

  return (
    <PopoverBase open={isOpen} modal={false}>
      <PopoverAnchor>{children}</PopoverAnchor>

      <PopoverContent className="w-auto p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="box-content flex items-center">
          <Button onClick={onOpenEdit} variant="ghost">
            {NodeTypeLabels.editMetric?.label ?? 'Edit metric'}
          </Button>

          <Button prefix={<NodeTypeIcons.trash />} variant="ghost" {...removeButtonProps}></Button>
        </div>
      </PopoverContent>

      <AddMetricModal
        open={openEditModal}
        loading={false}
        selectedMetrics={preselectedMetrics}
        onClose={onCloseEdit}
        onAddMetrics={handleAddMetrics}
        selectionMode="single"
        saveButtonText="Update metric"
      />
    </PopoverBase>
  );
}