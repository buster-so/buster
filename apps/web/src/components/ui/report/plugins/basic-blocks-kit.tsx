import {
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
  BlockquotePlugin,
  HorizontalRulePlugin
} from '@platejs/basic-nodes/react';
import {
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  H5Element,
  H6Element
} from '../elements/HeadingNode';
import { ParagraphPlugin } from 'platejs/react';
import { ParagraphElement } from '../elements/ParagraphNode';
import { BlockquoteElement } from '../elements/BlockquoteNode';
import { HrElement } from '../elements/HrNode';

export const BasicBlocksKit = [
  H1Plugin.configure({
    node: {
      component: H1Element
    },
    rules: {
      break: { empty: 'reset' }
    },
    shortcuts: { toggle: { keys: 'mod+alt+1' } }
  }),
  H2Plugin.configure({
    node: {
      component: H2Element
    },
    rules: {
      break: { empty: 'reset' }
    },
    shortcuts: { toggle: { keys: 'mod+alt+2' } }
  }),
  H3Plugin.configure({
    node: {
      component: H3Element
    },
    rules: {
      break: { empty: 'reset' }
    },
    shortcuts: { toggle: { keys: 'mod+alt+3' } }
  }),
  H4Plugin.configure({
    node: {
      component: H4Element
    },
    rules: {
      break: { empty: 'reset' }
    },
    shortcuts: { toggle: { keys: 'mod+alt+4' } }
  }),
  H5Plugin.configure({
    node: {
      component: H5Element
    },
    rules: {
      break: { empty: 'reset' }
    },
    shortcuts: { toggle: { keys: 'mod+alt+5' } }
  }),
  H6Plugin.configure({
    node: {
      component: H6Element
    },
    rules: {
      break: { empty: 'reset' }
    },
    shortcuts: { toggle: { keys: 'mod+alt+6' } }
  }),
  ParagraphPlugin.withComponent(ParagraphElement),
  BlockquotePlugin.withComponent(BlockquoteElement),
  HorizontalRulePlugin.withComponent(HrElement)
];
