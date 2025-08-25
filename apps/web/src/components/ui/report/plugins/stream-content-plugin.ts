import type { PlateEditor } from 'platejs/react';
import type { Element, TElement, Text, Value } from 'platejs';
import { createPlatePlugin } from 'platejs/react';

export const StreamContentPlugin = createPlatePlugin({
  key: 'streamContent',
  node: { isLeaf: true, isDecoration: false },
  options: {
    isStreaming: false,
    previousChunkId: null as string | null
  }
}).extendEditorApi((ctx) => ({
  streamContent: {
    /**
     * Start streaming mode
     */
    start: () => {
      ctx.setOption('isStreaming', true);
      ctx.setOption('previousChunkId', null);
    },

    /**
     * Stop streaming mode
     */
    stop: () => {
      const editor = ctx.editor as PlateEditor;

      // Remove all streamContent marks from the editor
      editor.tf.withoutNormalizing(() => {
        // Remove streamContent marks from all text nodes
        removeStreamContentMarksFromEditor(editor);
      });

      ctx.setOption('isStreaming', false);
      ctx.setOption('previousChunkId', null);
    },

    /**
     * Check if currently streaming
     */
    isStreaming: () => {
      return ctx.getOption('isStreaming') as boolean;
    },

    /**
     * Stream complete array of chunks with efficient length-based updates
     */
    streamFull: (chunks: Value) => {
      const editor = ctx.editor as PlateEditor;

      if (!chunks || chunks.length === 0) {
        return;
      }

      // Prevent undo/redo and defer normalization for performance

      editor.tf.withoutSaving(() => {
        editor.tf.withoutNormalizing(() => {
          const operations = buildUpdateOperations(editor, chunks);
          executeOperations(operations);
        });
      });
    }
  }
}));

/**
 * Build operations needed to update the editor with new chunks
 */
const buildUpdateOperations = (editor: PlateEditor, chunks: Value): Array<() => void> => {
  const currentNodes = editor.children;
  const currentLength = currentNodes.length;
  const incomingLength = chunks.length;
  const operations: Array<() => void> = [];

  // Process existing nodes and new nodes
  for (let i = 0; i < incomingLength; i++) {
    const chunk = chunks[i];

    if (i < currentLength) {
      // Handle existing node at this position
      const operation = buildNodeUpdateOperation(
        editor,
        i,
        currentNodes[i] as TElement,
        chunk as TElement
      );
      if (operation) {
        operations.push(operation);
      }
    } else {
      // Handle new node to append
      operations.push(() => appendNewNode(editor, chunk));
    }
  }

  // Handle removal of extra nodes
  if (currentLength > incomingLength) {
    operations.push(() => removeExtraNodes(editor, incomingLength, currentLength));
  }

  return operations;
};

/**
 * Build operation for updating an existing node
 */
const buildNodeUpdateOperation = (
  editor: PlateEditor,
  index: number,
  existingNode: TElement,
  chunk: TElement
): (() => void) | null => {
  // Quick ID check first (fast)
  if (existingNode.id !== chunk.id) {
    return () => replaceNode(editor, index, chunk);
  }

  // Same ID, check if content changed
  const existingText = extractTextFromNode(existingNode);
  const incomingText = extractTextFromChildren(chunk.children);

  if (existingText !== incomingText) {
    return () => replaceNode(editor, index, chunk);
  }

  return null; // No update needed
};

/**
 * Replace a node at the specified index
 */
const replaceNode = (editor: PlateEditor, index: number, chunk: TElement) => {
  editor.tf.removeNodes({ at: [index] });
  const nodeToInsert = {
    ...chunk,
    id: chunk.id // Ensure ID is preserved
  };
  addStreamContentMark(nodeToInsert);
  editor.tf.insertNodes(nodeToInsert, { at: [index], select: false });
};

/**
 * Append a new node to the end of the editor
 */
const appendNewNode = (editor: PlateEditor, chunk: TElement) => {
  addStreamContentMark(chunk);
  const nodeToInsert = {
    ...chunk,
    id: chunk.id // Ensure ID is preserved
  };
  const insertIndex = editor.children.length;
  editor.tf.insertNodes(nodeToInsert, {
    at: [insertIndex],
    select: false
  });
  editor.tf.addMark('streamContent', true);
  editor.tf.addMarks({ streamContent: true });
};

const addStreamContentMark = (chunk: TElement) => {
  (chunk.children as Value).forEach((child) => {
    child.streamContent = true;
  });
};

/**
 * Remove extra nodes from the end of the editor
 */
const removeExtraNodes = (editor: PlateEditor, startIndex: number, endIndex: number) => {
  // Remove extra nodes one by one (Slate doesn't support batch removal with array of paths)
  for (let i = endIndex - 1; i >= startIndex; i--) {
    editor.tf.removeNodes({ at: [i] });
  }
};

/**
 * Execute all operations in sequence
 */
const executeOperations = (operations: Array<() => void>) => {
  operations.forEach((op) => op());
};

/**
 * Extract text content from a node (optimized for performance)
 */
const extractTextFromNode = (node: Element | Text): string => {
  if ('text' in node) {
    return typeof node.text === 'string' ? node.text : '';
  }
  if ('children' in node && Array.isArray(node.children)) {
    // Use string concatenation instead of join for better performance
    let result = '';
    for (const child of node.children) {
      result += extractTextFromNode(child as Element | Text);
    }
    return result;
  }
  return '';
};

/**
 * Extract text content from children array (optimized for performance)
 */
const extractTextFromChildren = (children: TElement['children']): string => {
  // Use string concatenation instead of map/join for better performance
  let result = '';
  for (const node of children) {
    result += extractTextFromNode(node as Element | Text);
  }
  return result;
};

/**
 * Remove all streamContent marks from the editor
 */
const removeStreamContentMarksFromEditor = (editor: PlateEditor) => {
  editor.tf.withoutNormalizing(() => {
    editor.tf.setNodes(
      { streamContent: undefined },
      {
        at: [],
        match: (node) => node.text !== undefined && node.streamContent
      }
    );
  });
};
