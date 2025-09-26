import React, { useEffect, useRef } from 'react';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';
import { InputTextArea, type InputTextAreaRef } from '@/components/ui/inputs/InputTextArea';
import { EditableTitle } from '@/components/ui/typography/EditableTitle';
import { useDebounce } from '@/hooks/useDebounce';
import { useMount } from '@/hooks/useMount';
import { useSize } from '@/hooks/useSize';

export const DASHBOARD_TITLE_INPUT_ID = (dashboardId: string) => `${dashboardId}-title-input`;

const DEFAULT_TITLE = 'Untitled Dashboard';

export const DashboardEditTitles: React.FC<{
  title: string;
  description: string;
  readOnly?: boolean;
  dashboardId: string;
}> = React.memo(({ readOnly, title, description, dashboardId }) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const inputTextAreaRef = useRef<InputTextAreaRef>(null);
  const size = useSize(titleRef);
  const debouncedWidth = useDebounce(size?.width, { wait: 50, maxWait: 85 });
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard({
    saveToServer: false,
  });

  const onChangeTitle = (name: string) => {
    if (!readOnly) onUpdateDashboard({ name, id: dashboardId, description });
  };

  const onChangeDashboardDescription = (value: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!readOnly) {
      onUpdateDashboard({ description: value.target.value, id: dashboardId, name: title });
    }
  };

  useMount(() => {
    const isDefaultTitle = title === DEFAULT_TITLE;
    if (isDefaultTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  });

  useEffect(() => {
    if (debouncedWidth) {
      inputTextAreaRef.current?.forceRecalculateHeight?.();
    }
  }, [debouncedWidth]);

  return (
    <div className="flex flex-col space-y-1.5">
      <EditableTitle
        ref={titleRef}
        className="w-full truncate"
        readOnly={readOnly}
        onSetValue={onChangeTitle}
        onChange={onChangeTitle}
        id={DASHBOARD_TITLE_INPUT_ID(dashboardId)}
        placeholder="New dashboard"
        level={3}
      >
        {title}
      </EditableTitle>

      {(description || !readOnly) && (
        <InputTextArea
          ref={inputTextAreaRef}
          variant="ghost"
          readOnly={false}
          onChange={onChangeDashboardDescription}
          value={description}
          minRows={1}
          maxRows={25}
          className={'py-0! pl-0! text-gray-dark!'}
          placeholder="Add description..."
        />
      )}
    </div>
  );
});
DashboardEditTitles.displayName = 'DashboardEditTitles';
