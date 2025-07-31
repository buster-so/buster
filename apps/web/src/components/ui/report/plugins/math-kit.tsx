'use client';

import { EquationPlugin, InlineEquationPlugin } from '@platejs/math/react';

import { EquationElement, InlineEquationElement } from '../elements/EquationNode';

export const MathKit = [
  InlineEquationPlugin.withComponent(InlineEquationElement),
  EquationPlugin.withComponent(EquationElement)
];
