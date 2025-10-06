import type { ChartEncodes, ChartType, ColumnLabelFormat } from '@buster/server-shared/metrics';
import type { Active } from '@dnd-kit/core';
import { useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { isNumericColumnStyle, isNumericColumnType } from '@/lib/messages';
import { SelectAxisContainerId } from '../config';
import {
  useAxisContextColumnLabelFormats,
  useAxisContextSelectedAxis,
  useAxisContextSelectedChartType,
} from '../useSelectAxisContext';
import type { DropZoneInternal } from './interfaces';

interface ZoneError {
  error: boolean;
  reason: string | null;
  zoneId: SelectAxisContainerId;
}

export const useErrorZones = () => {
  const selectedChartType = useAxisContextSelectedChartType();
  const columnLabelFormats = useAxisContextColumnLabelFormats();
  const selectedAxis = useAxisContextSelectedAxis();
  const [errorZone, setErrorZone] = useState<ZoneError | null>(null);

  const onDragOverCheckErrorZone = useMemoizedFn(
    (
      targetZone: DropZoneInternal | null,
      sourceZone: DropZoneInternal | null,
      activeItem: Active
    ) => {
      const sourceZoneId = sourceZone?.id;
      if (targetZone && sourceZoneId) {
        if (sourceZoneId !== targetZone.id) {
          const originalItemId = activeItem.data?.current?.item.originalId;
          const columnLabelFormat = columnLabelFormats[originalItemId];
          const zoneError = checkForError(
            targetZone,
            sourceZone,
            originalItemId,
            columnLabelFormat,
            selectedChartType,
            selectedAxis
          );
          if (zoneError) {
            setErrorZone(zoneError);
          } else {
            setErrorZone(null);
          }

          return;
        }

        setErrorZone(null); // Clear error state when dragging within the same zone
      }
    }
  );

  return { errorZone, setErrorZone, onDragOverCheckErrorZone };
};

const checkDuplicates = (targetZone: DropZoneInternal, activeItemOriginalId: string): boolean => {
  return targetZone.items.some((item) => item.originalId === activeItemOriginalId);
};

const zoneErrorRecord: Record<
  SelectAxisContainerId,
  (
    targetZone: DropZoneInternal,
    sourceZone: DropZoneInternal,
    columnLabelFormat: Required<ColumnLabelFormat>,
    selectedChartType: ChartType,
    axis: Parameters<typeof checkForError>[5],
    activeItemOriginalId: string
  ) => {
    error: boolean;
    reason: string;
  } | null
> = {
  [SelectAxisContainerId.Available]: () => null,
  [SelectAxisContainerId.Metric]: () => null,
  [SelectAxisContainerId.XAxis]: (
    targetZone,
    sourceZone,
    _columnLabelFormat,
    _selectedChartType,
    axis,
    activeItemOriginalId
  ) => {
    const isInCategoryAxis =
      axis !== null &&
      'category' in axis &&
      axis.category?.includes(activeItemOriginalId) &&
      !sourceZone?.items.some((item) => item.originalId === activeItemOriginalId);

    if (isInCategoryAxis) {
      return {
        error: true,
        reason: 'Cannot add a column that is already in the category',
        zoneId: targetZone.id,
      };
    }

    return null;
  },
  [SelectAxisContainerId.YAxis]: (targetZone, _sourceZone, columnLabelFormat) => {
    const isNumericType = isNumericColumnType(columnLabelFormat.columnType);
    if (!isNumericType) {
      return {
        error: true,
        reason: 'Y-axis must be numeric column type',
        zoneId: targetZone.id,
      };
    }

    const isNumericStyle = isNumericColumnStyle(columnLabelFormat.style);
    if (!isNumericStyle) {
      return {
        error: true,
        reason: 'Y-axis must be a number style (number, currency, percentage)',
        zoneId: targetZone.id,
      };
    }

    return null;
  },
  [SelectAxisContainerId.Y2Axis]: (targetZone, _sourceZone, columnLabelFormat) => {
    const isNumericType = isNumericColumnType(columnLabelFormat.columnType);
    if (!isNumericType) {
      return {
        error: true,
        reason: 'Right Y-axis must be numeric column type',
        zoneId: targetZone.id,
      };
    }

    const isNumericStyle = isNumericColumnStyle(columnLabelFormat.style);
    if (!isNumericStyle) {
      return {
        error: true,
        reason: 'Right Y-axis must be a number style (number, currency, percentage)',
        zoneId: targetZone.id,
      };
    }

    return null;
  },
  [SelectAxisContainerId.CategoryAxis]: (
    targetZone,
    sourceZone,
    _columnLabelFormat,
    _selectedChartType,
    axis,
    activeItemOriginalId
  ) => {
    const isInCategoryAxis =
      axis !== null &&
      'category' in axis &&
      axis.category?.includes(activeItemOriginalId) &&
      !sourceZone?.items.some((item) => item.originalId === activeItemOriginalId);

    if (isInCategoryAxis) {
      return {
        error: true,
        reason: 'Cannot add a column that is already in the x-axis',
        zoneId: targetZone.id,
      };
    }

    return null;
  },
  [SelectAxisContainerId.SizeAxis]: (targetZone) => {
    if (targetZone.items.length >= 1) {
      return {
        error: true,
        reason: 'Cannot add more than one size column',
      };
    }
    return null;
  },
  [SelectAxisContainerId.ColorBy]: (targetZone) => {
    if (targetZone.items.length >= 1) {
      return {
        error: true,
        reason: 'Cannot add more than one color by column',
      };
    }
    return null;
  },
  [SelectAxisContainerId.Tooltip]: () => null,
};

const checkForError = (
  targetZone: DropZoneInternal,
  sourceZone: DropZoneInternal,
  activeItemOriginalId: string,
  columnLabelFormat: Required<ColumnLabelFormat>,
  selectedChartType: ChartType,
  axis: ChartEncodes | null
): ZoneError | null => {
  const hasDuplicate = checkDuplicates(targetZone, activeItemOriginalId);

  if (hasDuplicate) {
    return {
      error: true,
      reason: 'Cannot add duplicate column',
      zoneId: targetZone.id,
    };
  }

  const targetZoneId = targetZone.id;
  const zoneError = zoneErrorRecord[targetZoneId](
    targetZone,
    sourceZone,
    columnLabelFormat,
    selectedChartType,
    axis,
    activeItemOriginalId
  );

  if (!zoneError) return null;

  return {
    ...zoneError,
    zoneId: targetZone.id,
  };
};
