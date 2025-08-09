import { createPlatePlugin } from 'platejs/react';
import { MetricElement } from '../../elements/MetricElement/MetricElement';
import { CUSTOM_KEYS } from '../../config/keys';
import type { Path, SetNodesOptions, TElement } from 'platejs';

export type MetricPluginOptions = {
  openMetricModal: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type MetricPluginApi = {
  // the methods are defined in the extendApi function
};

export type TMetricElement = TElement & {
  type: typeof CUSTOM_KEYS.metric;
  metricId: string;
  metricVersionNumber: number | undefined;
  children: [{ text: '' }];
};

export const MetricPlugin = createPlatePlugin<
  typeof CUSTOM_KEYS.metric,
  MetricPluginOptions,
  MetricPluginApi,
  TMetricElement
>({
  key: CUSTOM_KEYS.metric,
  options: {
    openMetricModal: false
  },
  node: {
    type: CUSTOM_KEYS.metric,
    isElement: true,
    isVoid: false,
    component: MetricElement
  },
  handlers: {
    onKeyDown: ({ editor, event }) => {
      // Only handle single-caret (collapsed) cases
      if (!editor.api.isCollapsed()) return true;

      const key = event.key;
      if (key !== 'Backspace' && key !== 'Delete') return true;

      const block = editor.api.block<TElement>();
      if (!block) return true;

      const [, path] = block;

      // Helper to get sibling at offset from current block index
      const getSiblingEntry = (offset: number) => {
        const index = path[path.length - 1] + offset;
        if (index < 0) return undefined;
        const siblingPath = [...path.slice(0, -1), index] as unknown as Path;
        return editor.api.node<TElement>(siblingPath);
      };

      // Backspace at start of block should remove previous metric node
      if (key === 'Backspace' && editor.api.isAt({ start: true })) {
        const prevEntry = getSiblingEntry(-1);
        if (!prevEntry) return true;
        const [prevNode, prevPath] = prevEntry;
        if ((prevNode as TElement).type === CUSTOM_KEYS.metric) {
          event.preventDefault();
          editor.tf.removeNodes({ at: prevPath });
          return false;
        }
      }

      // Delete at end of block should remove next metric node
      if (key === 'Delete' && editor.api.isAt({ end: true })) {
        const nextEntry = getSiblingEntry(1);
        if (!nextEntry) return true;
        const [nextNode, nextPath] = nextEntry;
        if ((nextNode as TElement).type === CUSTOM_KEYS.metric) {
          event.preventDefault();
          editor.tf.removeNodes({ at: nextPath });
          return false;
        }
      }

      return true;
    }
  }
}).extendApi(({ setOption, plugin, editor, tf, ...rest }) => {
  return {
    openAddMetricModal: () => {
      setOption('openMetricModal', true);
    },
    closeAddMetricModal: () => {
      setOption('openMetricModal', false);
    },
    updateMetric: (metricId: string, options?: SetNodesOptions<TMetricElement[]>) => {
      tf.setNodes<TMetricElement>({ metricId }, options);
    }
  };
});

export const MetricKit = [MetricPlugin];
