import { BaseEquationPlugin, BaseInlineEquationPlugin } from '@platejs/math';

import { EquationElementStatic, InlineEquationElementStatic } from '../elements/EquationNodeStatic';

export const BaseMathKit = [
  BaseInlineEquationPlugin.withComponent(InlineEquationElementStatic),
  BaseEquationPlugin.withComponent(EquationElementStatic)
];
