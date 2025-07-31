'use client';

import { CodeBlockPlugin, CodeLinePlugin, CodeSyntaxPlugin } from '@platejs/code-block/react';
import { common, createLowlight } from 'lowlight';
import { type AnyPluginConfig } from 'platejs';

import { CodeBlockElement, CodeLineElement, CodeSyntaxLeaf } from '../elements/CodeBlockNode';
// import sql from 'highlight.js/lib/languages/sql';
// import yaml from 'highlight.js/lib/languages/yaml';
// import javascript from 'highlight.js/lib/languages/javascript';
// import typescript from 'highlight.js/lib/languages/typescript';

const lowlight = createLowlight();
const isClient = typeof window !== 'undefined';

if (isClient) {
  lowlight.register(common);
  // lowlight.register('yaml', yaml);
  // lowlight.register('javascript', javascript);
  // lowlight.register('typescript', typescript);
}

export const CodeBlockKit = [
  CodeBlockPlugin.configure({
    node: { component: CodeBlockElement },
    options: { lowlight, defaultLanguage: 'sql' },
    shortcuts: { toggle: { keys: 'mod+alt+8' } }
  }),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf)
];
