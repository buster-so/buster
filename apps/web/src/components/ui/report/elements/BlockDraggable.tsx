'use client';

import * as React from 'react';

import { DndPlugin, useDraggable, useDropLine } from '@platejs/dnd';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { GripDotsVertical, Plus } from '@/components/ui/icons';
import { getPluginByType, isType, KEYS, type TElement } from 'platejs';
import {
  type PlateEditor,
  type PlateElementProps,
  type RenderNodeWrapper,
  MemoizedChildren,
  useEditorRef,
  useElement,
  usePath,
  usePluginOption
} from 'platejs/react';
import { useSelected } from 'platejs/react';

import { Button } from '@/components/ui/buttons';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { expandListItemsWithChildren } from '@platejs/list';

const UNDRAGGABLE_KEYS = [KEYS.column, KEYS.tr, KEYS.td];

export const BlockDraggable: RenderNodeWrapper = ({ editor, element, path }) => {
  const enabled = React.useMemo(() => {
    if (path.length === 1 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      return true;
    }
    if (path.length === 3 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      const block = editor.api.some({
        at: path,
        match: {
          type: editor.getType(KEYS.column)
        }
      });

      if (block) {
        return true;
      }
    }
    if (path.length === 4 && !isType(editor, element, UNDRAGGABLE_KEYS)) {
      const block = editor.api.some({
        at: path,
        match: {
          type: editor.getType(KEYS.table)
        }
      });

      if (block) {
        return true;
      }
    }

    return false;
  }, [editor, element, path]);

  if (!enabled) return;

  // Return a function that renders the Draggable component
  const Component = (props: PlateElementProps) => <Draggable {...props} />;
  Component.displayName = 'BlockDraggable';

  return Component;
};

function Draggable(props: PlateElementProps) {
  const { children, editor, element, path } = props;
  const blockSelectionApi = editor.getApi(BlockSelectionPlugin).blockSelection;
  const { isDragging, nodeRef, previewRef, handleRef } = useDraggable({
    element,
    onDropHandler: (_, { dragItem }) => {
      const id = (dragItem as { id: string[] | string }).id;
      if (blockSelectionApi) {
        blockSelectionApi.add(id);
      }
      resetPreview();
    }
  });
  const isInColumn = path.length === 3;
  const isInTable = path.length === 4;
  const [previewTop, setPreviewTop] = React.useState(0);
  const resetPreview = () => {
    if (previewRef.current) {
      previewRef.current.replaceChildren();
    }
  };
  // clear up virtual multiple preview when drag end
  React.useEffect(() => {
    if (!isDragging) {
      resetPreview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  const [dragButtonTop, setDragButtonTop] = React.useState(0);

  return (
    <div
      className={cn(
        'relative',
        isDragging && 'opacity-50',
        getPluginByType(editor, element.type)?.node.isContainer ? 'group/container' : 'group'
      )}
      onMouseEnter={() => {
        if (isDragging) return;
        setDragButtonTop(calcDragButtonTop(editor, element));
      }}>
      {!isInTable && (
        <Gutter>
          <div className={cn('slate-blockToolbarWrapper', 'flex', isInColumn && 'h-4')}>
            <div
              className={cn(
                'slate-blockToolbar pointer-events-auto relative mr-1 flex w-13 items-center',
                isInColumn && 'mr-1.5',
                'flex items-center justify-center space-x-0.5'
              )}>
              <AddNewBlockButton
                style={{ top: `${dragButtonTop + 3}px` }}
                isDragging={isDragging}
              />
              <Button
                ref={handleRef}
                variant="ghost"
                style={{ top: `${dragButtonTop + 3}px` }}
                data-plate-prevent-deselect
                prefix={
                  <DragHandle
                    isDragging={isDragging}
                    previewRef={previewRef}
                    resetPreview={resetPreview}
                    setPreviewTop={setPreviewTop}
                  />
                }></Button>
            </div>
          </div>
        </Gutter>
      )}
      <div
        ref={previewRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'absolute -left-0 hidden w-full overflow-hidden',
          isDragging && 'overflow-hidden rounded-full bg-red-500 opacity-20'
        )}
        style={{ top: `${-previewTop}px` }}
        contentEditable={false}
      />
      <div
        ref={nodeRef as React.RefObject<HTMLDivElement>}
        className={cn(
          'slate-blockWrapper flow-root',
          isDragging && 'bg-primary/25 overflow-hidden rounded opacity-50'
        )}
        onContextMenu={(event) =>
          editor.getApi(BlockSelectionPlugin).blockSelection.addOnContextMenu({ element, event })
        }>
        <MemoizedChildren>{children}</MemoizedChildren>
        <DropLine />
      </div>
    </div>
  );
}

function Gutter({ children, className, ...props }: React.ComponentProps<'div'>) {
  const editor = useEditorRef();
  const element = useElement();
  const isSelectionAreaVisible = usePluginOption(BlockSelectionPlugin, 'isSelectionAreaVisible');
  const selected = useSelected();
  return (
    <div
      {...props}
      className={cn(
        'slate-gutterLeft',
        'absolute top-0 z-50 flex h-full -translate-x-full cursor-text hover:opacity-100 sm:opacity-0',
        getPluginByType(editor, element.type)?.node.isContainer
          ? 'group-hover/container:opacity-100'
          : 'group-hover:opacity-100',
        isSelectionAreaVisible && 'hidden',
        !selected && 'opacity-0',
        className
      )}
      contentEditable={false}>
      {children}
    </div>
  );
}

const DragHandle = React.memo(function DragHandle({
  isDragging,
  previewRef,
  resetPreview,
  setPreviewTop
}: {
  isDragging: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
  resetPreview: () => void;
  setPreviewTop: (top: number) => void;
}) {
  const editor = useEditorRef();
  const element = useElement();
  return (
    <Tooltip title={isDragging ? '' : 'Drag to move'}>
      <div
        className="flex size-full items-center justify-center"
        onClick={() => {
          editor.getApi(BlockSelectionPlugin).blockSelection.set(element.id as string);
        }}
        onMouseDown={(e) => {
          resetPreview();
          if (e.button !== 0 || e.shiftKey) return; // Only left mouse button
          const elements = createDragPreviewElements(editor, {
            currentBlock: element
          });
          previewRef.current?.append(...elements);
          previewRef.current?.classList.remove('hidden');
          editor.setOption(DndPlugin, 'multiplePreviewRef', previewRef);
        }}
        onMouseEnter={() => {
          if (isDragging) return;
          const blockSelection = editor
            .getApi(BlockSelectionPlugin)
            .blockSelection.getNodes({ sort: true });
          const selectedBlocks =
            blockSelection.length > 0 ? blockSelection : editor.api.blocks({ mode: 'highest' });
          // Process selection to include list children
          const processedBlocks = expandListItemsWithChildren(editor, selectedBlocks);
          const ids = processedBlocks.map((block) => block[0].id as string);
          if (ids.length > 1 && ids.includes(element.id as string)) {
            const previewTop = calculatePreviewTop(editor, {
              blocks: processedBlocks.map((block) => block[0]),
              element
            });
            setPreviewTop(previewTop);
          } else {
            setPreviewTop(0);
          }
        }}
        onMouseUp={() => {
          resetPreview();
        }}
        role="button">
        <div className="text-muted-foreground">
          <GripDotsVertical />
        </div>
      </div>
    </Tooltip>
  );
});

DragHandle.displayName = 'DragHandle';

const DropLine = React.memo(function DropLine({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;
  return (
    <div
      {...props}
      className={cn(
        'slate-dropLine',
        'absolute inset-x-0 h-0.5 opacity-100 transition-opacity',
        'bg-primary/50',
        dropLine === 'top' && '-top-px',
        dropLine === 'bottom' && '-bottom-px',
        className
      )}
    />
  );
});

DropLine.displayName = 'DropLine';

const AddNewBlockButton = React.memo(function AddNewBlockButton({
  style,
  className,
  isDragging
}: {
  style: React.CSSProperties;
  className?: string;
  isDragging: boolean;
}) {
  const editor = useEditorRef();
  const path = usePath();

  const handleClick = (event: React.MouseEvent) => {
    // build the insertion point based on modifier key
    const parentPath = path.slice(0, -1);
    const currentIndex = path[path.length - 1];

    // Option/Alt key adds before, regular click adds after
    const insertIndex = event.altKey ? currentIndex : currentIndex + 1;

    editor.tf.insertNodes(
      { type: 'p', children: [{ text: '' }] },
      { at: [...parentPath, insertIndex] }
    );

    setTimeout(() => {
      // Calculate the path to the start of the new paragraph's text
      const newNodePath = [...parentPath, insertIndex];
      const textPath = [...newNodePath, 0]; // Path to the first text node

      // Set the selection to the start of the new paragraph
      editor.tf.select({
        anchor: { path: textPath, offset: 0 },
        focus: { path: textPath, offset: 0 }
      });

      // Ensure the editor is focused
      editor.tf.focus();
    }, 25);
  };

  return (
    <Tooltip title={isDragging ? '' : 'Add new block'}>
      <Button
        onClick={handleClick}
        variant="ghost"
        className={cn(className)}
        prefix={<Plus />}
        style={style}
      />
    </Tooltip>
  );
});

AddNewBlockButton.displayName = 'AddNewBlockButton';

const createDragPreviewElements = (
  editor: PlateEditor,
  { currentBlock }: { currentBlock: TElement }
): HTMLElement[] => {
  const blockSelection = editor
    .getApi(BlockSelectionPlugin)
    .blockSelection.getNodes({ sort: true });
  let selectionNodes =
    blockSelection.length > 0 ? blockSelection : editor.api.blocks({ mode: 'highest' });
  // If current block is not in selection, use it as the starting point
  if (!selectionNodes.some(([node]) => node.id === currentBlock.id)) {
    selectionNodes = [[currentBlock, editor.api.findPath(currentBlock)!]];
  }
  // Process selection nodes to include list children
  const sortedNodes = expandListItemsWithChildren(editor, selectionNodes).map(([node]) => node);
  if (blockSelection.length === 0) {
    editor.tf.blur();
    editor.tf.collapse();
  }
  const elements: HTMLElement[] = [];
  const ids: string[] = [];
  /**
   * Remove data attributes from the element to avoid recognized as slate
   * elements incorrectly.
   */
  const removeDataAttributes = (element: HTMLElement) => {
    Array.from(element.attributes).forEach((attr) => {
      if (attr.name.startsWith('data-slate') || attr.name.startsWith('data-block-id')) {
        element.removeAttribute(attr.name);
      }
    });
    Array.from(element.children).forEach((child) => {
      removeDataAttributes(child as HTMLElement);
    });
  };
  const resolveElement = (node: TElement, index: number) => {
    const domNode = editor.api.toDOMNode(node)!;
    const newDomNode = domNode.cloneNode(true) as HTMLElement;
    ids.push(node.id as string);
    const wrapper = document.createElement('div');
    wrapper.append(newDomNode);
    wrapper.style.display = 'flow-root';
    const lastDomNode = sortedNodes[index - 1];
    if (lastDomNode) {
      const lastDomNodeRect = editor.api
        .toDOMNode(lastDomNode)!
        .parentElement!.getBoundingClientRect();
      const domNodeRect = domNode.parentElement!.getBoundingClientRect();
      const distance = domNodeRect.top - lastDomNodeRect.bottom;
      // Check if the two elements are adjacent (touching each other)
      if (distance > 15) {
        wrapper.style.marginTop = `${distance}px`;
      }
    }
    removeDataAttributes(newDomNode);
    elements.push(wrapper);
  };
  sortedNodes.forEach((node, index) => resolveElement(node, index));
  editor.setOption(DndPlugin, 'draggingId', ids);
  return elements;
};

const calculatePreviewTop = (
  editor: PlateEditor,
  {
    blocks,
    element
  }: {
    blocks: TElement[];
    element: TElement;
  }
): number => {
  const child = editor.api.toDOMNode(element)!;
  const editable = editor.api.toDOMNode(editor)!;
  const firstSelectedChild = blocks[0];
  const firstDomNode = editor.api.toDOMNode(firstSelectedChild)!;
  // Get editor's top padding
  const editorPaddingTop = Number(window.getComputedStyle(editable).paddingTop.replace('px', ''));
  // Calculate distance from first selected node to editor top
  const firstNodeToEditorDistance =
    firstDomNode.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;
  // Get margin top of first selected node
  const firstMarginTopString = window.getComputedStyle(firstDomNode).marginTop;
  const marginTop = Number(firstMarginTopString.replace('px', ''));
  // Calculate distance from current node to editor top
  const currentToEditorDistance =
    child.getBoundingClientRect().top - editable.getBoundingClientRect().top - editorPaddingTop;
  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace('px', ''));
  const previewElementsTopDistance =
    currentToEditorDistance - firstNodeToEditorDistance + marginTop - currentMarginTop;
  return previewElementsTopDistance;
};

const calcDragButtonTop = (editor: PlateEditor, element: TElement): number => {
  const child = editor.api.toDOMNode(element)!;
  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace('px', ''));
  return currentMarginTop;
};
