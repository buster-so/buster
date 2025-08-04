'use client';

import * as React from 'react';

import type * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

import { useDraggable, useDropLine } from '@platejs/dnd';
import { BlockSelectionPlugin, useBlockSelected } from '@platejs/selection/react';
import { setCellBackground } from '@platejs/table';
import {
  TablePlugin,
  TableProvider,
  useTableBordersDropdownMenuContentState,
  useTableCellElement,
  useTableCellElementResizable,
  useTableElement,
  useTableMergeState
} from '@platejs/table/react';
import { PopoverAnchor } from '@radix-ui/react-popover';
import { cva } from 'class-variance-authority';
import { NodeTypeIcons } from '../../config/icons';
import {
  type TElement,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
  KEYS,
  PathApi
} from 'platejs';
import {
  type PlateElementProps,
  PlateElement,
  useComposedRef,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useElement,
  usePluginOption,
  useReadOnly,
  useRemoveNodeButton,
  useSelected,
  withHOC
} from 'platejs/react';
import { useElementSelector } from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { PopoverBase, PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { blockSelectionVariants } from '../BlockSelection';
import { ColorDropdownMenuItems, DEFAULT_COLORS } from '../FontColorToolbarButton';
import { ResizeHandle } from '../ResizeHandle';
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderRightIcon,
  BorderTopIcon
} from './TableIcons';
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup
} from '@/components/ui/toolbar/Toolbar';

export const TableElement = withHOC(
  TableProvider,
  function TableElement({ children, ...props }: PlateElementProps<TTableElement>) {
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, 'isSelectionAreaVisible');
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const selected = useSelected();
    const { isSelectingCell, marginLeft, props: tableProps } = useTableElement();

    const content = (
      <PlateElement
        {...props}
        className={cn(
          'overflow-x-auto py-5',
          hasControls && '-ml-2 *:data-[slot=block-selection]:left-2'
        )}
        style={{ paddingLeft: marginLeft }}>
        <div className="group/table relative w-fit">
          <table
            className={cn(
              'mr-0 ml-px table h-px table-fixed border-collapse',
              isSelectingCell && 'selection:bg-transparent'
            )}
            {...tableProps}>
            <tbody className="min-w-full">{children}</tbody>
          </table>
        </div>
      </PlateElement>
    );

    if (readOnly || !selected) {
      return content;
    }

    return <TableFloatingToolbar>{content}</TableFloatingToolbar>;
  }
);

function TableFloatingToolbar({ children, ...props }: React.ComponentProps<typeof PopoverContent>) {
  const { tf } = useEditorPlugin(TablePlugin);
  const element = useElement<TTableElement>();
  const { props: buttonProps } = useRemoveNodeButton({ element });
  const collapsed = useEditorSelector((editor) => !editor.api.isExpanded(), []);

  const { canMerge, canSplit } = useTableMergeState();

  return (
    <PopoverBase open={canMerge || canSplit || collapsed} modal={false}>
      <PopoverAnchor asChild>{children}</PopoverAnchor>
      <PopoverContent
        asChild
        className="p-1"
        onOpenAutoFocus={(e) => e.preventDefault()}
        contentEditable={false}
        {...props}>
        <Toolbar
          className="scrollbar-hide bg-popover flex w-auto max-w-[80vw] flex-row overflow-x-auto print:hidden"
          contentEditable={false}>
          <ToolbarGroup>
            <ColorDropdownMenu tooltip="Background color">
              <NodeTypeIcons.backgroundColor />
            </ColorDropdownMenu>
            {canMerge && (
              <ToolbarButton
                onClick={() => tf.table.merge()}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Merge cells">
                <NodeTypeIcons.tableMergeCells />
              </ToolbarButton>
            )}
            {canSplit && (
              <ToolbarButton
                onClick={() => tf.table.split()}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Split cell">
                <NodeTypeIcons.tableSplitCell />
              </ToolbarButton>
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger>
                <ToolbarButton tooltip="Cell borders">
                  <NodeTypeIcons.tableBorders />
                </ToolbarButton>
              </DropdownMenuTrigger>

              <DropdownMenuPortal>
                <TableBordersDropdownMenuContent />
              </DropdownMenuPortal>
            </DropdownMenu>

            {collapsed && (
              <ToolbarGroup>
                <ToolbarButton tooltip="Delete table" {...buttonProps}>
                  <NodeTypeIcons.tableDelete />
                </ToolbarButton>
              </ToolbarGroup>
            )}
          </ToolbarGroup>

          {collapsed && (
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableRow({ before: true });
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert row before">
                <NodeTypeIcons.tableArrowUp />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableRow();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert row after">
                <NodeTypeIcons.tableArrowDown />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.remove.tableRow();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Delete row">
                <NodeTypeIcons.tableRemove />
              </ToolbarButton>
            </ToolbarGroup>
          )}

          {collapsed && (
            <ToolbarGroup>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableColumn({ before: true });
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert column before">
                <NodeTypeIcons.tableArrowLeft />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.insert.tableColumn();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Insert column after">
                <NodeTypeIcons.tableArrowRight />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  tf.remove.tableColumn();
                }}
                onMouseDown={(e) => e.preventDefault()}
                tooltip="Delete column">
                <NodeTypeIcons.tableRemove />
              </ToolbarButton>
            </ToolbarGroup>
          )}
        </Toolbar>
      </PopoverContent>
    </PopoverBase>
  );
}

// TableBordersDropdownMenuContent is now a forwardRef functional component
const TableBordersDropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentProps<typeof DropdownMenuPrimitive.Content>
>(function TableBordersDropdownMenuContent(props, ref) {
  // Get the current editor instance
  const editor = useEditorRef();
  const {
    getOnSelectTableBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasNoBorders,
    hasOuterBorders,
    hasRightBorder,
    hasTopBorder
  } = useTableBordersDropdownMenuContentState();

  return (
    <DropdownMenuContent
      className="min-w-[220px]"
      onCloseAutoFocus={(e) => {
        e.preventDefault();
        editor.tf.focus();
      }}
      align="start"
      side="right"
      sideOffset={0}
      {...props}>
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasTopBorder}
          onCheckedChange={getOnSelectTableBorder('top')}>
          <BorderTopIcon />
          <div>Top Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRightBorder}
          onCheckedChange={getOnSelectTableBorder('right')}>
          <BorderRightIcon />
          <div>Right Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasBottomBorder}
          onCheckedChange={getOnSelectTableBorder('bottom')}>
          <BorderBottomIcon />
          <div>Bottom Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasLeftBorder}
          onCheckedChange={getOnSelectTableBorder('left')}>
          <BorderLeftIcon />
          <div>Left Border</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasNoBorders}
          onCheckedChange={getOnSelectTableBorder('none')}>
          <BorderNoneIcon />
          <div>No Border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasOuterBorders}
          onCheckedChange={getOnSelectTableBorder('outer')}>
          <BorderAllIcon />
          <div>Outside Borders</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
});

function ColorDropdownMenu({ children, tooltip }: { children: React.ReactNode; tooltip: string }) {
  const [open, setOpen] = React.useState(false);

  const editor = useEditorRef();
  const selectedCells = usePluginOption(TablePlugin, 'selectedCells');

  const onUpdateColor = React.useCallback(
    (color: string) => {
      setOpen(false);
      setCellBackground(editor, { color, selectedCells: selectedCells ?? [] });
    },
    [selectedCells, editor]
  );

  const onClearColor = React.useCallback(() => {
    setOpen(false);
    setCellBackground(editor, {
      color: null,
      selectedCells: selectedCells ?? []
    });
  }, [selectedCells, editor]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger>
        <ToolbarButton tooltip={tooltip}>{children}</ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start">
        <ToolbarMenuGroup label="Colors">
          <ColorDropdownMenuItems
            className="px-2"
            colors={DEFAULT_COLORS}
            updateColor={onUpdateColor}
          />
        </ToolbarMenuGroup>
        <DropdownMenuGroup>
          <DropdownMenuItem className="p-2" onClick={onClearColor}>
            <NodeTypeIcons.tableEraser />
            <span>Clear</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TableRowElement(props: PlateElementProps<TTableRowElement>) {
  const { element } = props;
  const readOnly = useReadOnly();
  const selected = useSelected();
  const editor = useEditorRef();
  const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, 'isSelectionAreaVisible');
  const hasControls = !readOnly && !isSelectionAreaVisible;

  const { isDragging, previewRef, handleRef } = useDraggable({
    element,
    type: element.type,
    canDropNode: ({ dragEntry, dropEntry }) =>
      PathApi.equals(PathApi.parent(dragEntry[1]), PathApi.parent(dropEntry[1])),
    onDropHandler: (_, { dragItem }) => {
      const dragElement = (dragItem as { element: TElement }).element;

      if (dragElement) {
        editor.tf.select(dragElement);
      }
    }
  });

  return (
    <PlateElement
      {...props}
      ref={useComposedRef(props.ref, previewRef)}
      as="tr"
      className={cn('group/row', isDragging && 'opacity-50')}
      attributes={{
        ...props.attributes,
        'data-selected': selected ? 'true' : undefined
      }}>
      {/* {hasControls && (
        <td className="w-2 select-none" contentEditable={false}>
          <RowDragHandle dragRef={handleRef} />
          <RowDropLine />
        </td>
      )} */}

      {props.children}
    </PlateElement>
  );
}

function RowDragHandle({ dragRef }: { dragRef: React.Ref<HTMLElement | HTMLButtonElement> }) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <Button
      ref={dragRef as React.Ref<HTMLButtonElement>}
      className={cn(
        'absolute top-1/2 left-0 z-51 h-6 w-4 -translate-y-1/2 p-0 focus-visible:ring-0 focus-visible:ring-offset-0',
        'cursor-grab! active:cursor-grabbing!',
        'opacity-0 transition-opacity duration-100 group-hover/row:opacity-100 group-has-data-[resizing="true"]/row:opacity-0'
      )}
      onClick={() => {
        editor.tf.select(element);
      }}
      prefix={<NodeTypeIcons.gripVertical />}
    />
  );
}

function RowDropLine() {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      className={cn(
        'bg-brand/50 absolute inset-x-0 left-2 z-50 h-0.5',
        dropLine === 'top' ? '-top-px' : '-bottom-px'
      )}
    />
  );
}

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { api } = useEditorPlugin(TablePlugin);
  const readOnly = useReadOnly();
  const element = props.element;

  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.tr
  });
  const isSelectingRow = useBlockSelected(rowId);
  const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, 'isSelectionAreaVisible');

  const { borders, colIndex, colSpan, minHeight, rowIndex, selected, width } =
    useTableCellElement();

  const { bottomProps, hiddenLeft, leftProps, rightProps } = useTableCellElementResizable({
    colIndex,
    colSpan,
    rowIndex
  });

  return (
    <PlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'bg-background h-full overflow-visible border-none p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left *:m-0',
        'before:size-full',
        selected && 'before:bg-brand/5 before:z-10',
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders.bottom?.size && `before:border-b-border before:border-b`,
        borders.right?.size && `before:border-r-border before:border-r`,
        borders.left?.size && `before:border-l-border before:border-l`,
        borders.top?.size && `before:border-t-border before:border-t`
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width || 240,
          minWidth: width || 120
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element)
      }}>
      <div className="relative z-20 box-border h-full px-3 py-2" style={{ minHeight }}>
        {props.children}
      </div>

      {!isSelectionAreaVisible && (
        <div
          className="group absolute top-0 size-full select-none"
          contentEditable={false}
          suppressContentEditableWarning={true}>
          {!readOnly && (
            <>
              <ResizeHandle
                {...rightProps}
                className="-top-2 -right-1 h-[calc(100%_+_8px)] w-2"
                data-col={colIndex}
              />
              <ResizeHandle {...bottomProps} className="-bottom-1 h-2" />
              {!hiddenLeft && (
                <ResizeHandle
                  {...leftProps}
                  className="top-0 -left-1 w-2"
                  data-resizer-left={colIndex === 0 ? 'true' : undefined}
                />
              )}

              <div
                className={cn(
                  'bg-ring absolute top-0 z-30 hidden h-full w-1',
                  'right-[-1.5px]',
                  columnResizeVariants({ colIndex: colIndex as 1 })
                )}
              />
              {colIndex === 0 && (
                <div
                  className={cn(
                    'bg-ring absolute top-0 z-30 h-full w-1',
                    'left-[-1.5px]',
                    'animate-in fade-in hidden group-has-[[data-resizer-left]:hover]/table:block group-has-[[data-resizer-left][data-resizing="true"]]/table:block'
                  )}
                />
              )}
            </>
          )}
        </div>
      )}

      {isSelectingRow && <div className={blockSelectionVariants()} contentEditable={false} />}
    </PlateElement>
  );
}

export function TableCellHeaderElement(props: React.ComponentProps<typeof TableCellElement>) {
  return <TableCellElement {...props} isHeader />;
}

const columnResizeVariants = cva('hidden animate-in fade-in', {
  variants: {
    colIndex: {
      0: 'group-has-[[data-col="0"]:hover]/table:block group-has-[[data-col="0"][data-resizing="true"]]/table:block',
      1: 'group-has-[[data-col="1"]:hover]/table:block group-has-[[data-col="1"][data-resizing="true"]]/table:block',
      2: 'group-has-[[data-col="2"]:hover]/table:block group-has-[[data-col="2"][data-resizing="true"]]/table:block',
      3: 'group-has-[[data-col="3"]:hover]/table:block group-has-[[data-col="3"][data-resizing="true"]]/table:block',
      4: 'group-has-[[data-col="4"]:hover]/table:block group-has-[[data-col="4"][data-resizing="true"]]/table:block',
      5: 'group-has-[[data-col="5"]:hover]/table:block group-has-[[data-col="5"][data-resizing="true"]]/table:block',
      6: 'group-has-[[data-col="6"]:hover]/table:block group-has-[[data-col="6"][data-resizing="true"]]/table:block',
      7: 'group-has-[[data-col="7"]:hover]/table:block group-has-[[data-col="7"][data-resizing="true"]]/table:block',
      8: 'group-has-[[data-col="8"]:hover]/table:block group-has-[[data-col="8"][data-resizing="true"]]/table:block',
      9: 'group-has-[[data-col="9"]:hover]/table:block group-has-[[data-col="9"][data-resizing="true"]]/table:block',
      10: 'group-has-[[data-col="10"]:hover]/table:block group-has-[[data-col="10"][data-resizing="true"]]/table:block'
    }
  }
});
