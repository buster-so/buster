'use client';

import { TogglePlugin } from '@platejs/toggle/react';

import { IndentKit } from './indent-kit';
import { ToggleElement } from '../elements/ToggleNode';

export const ToggleKit = [...IndentKit, TogglePlugin.withComponent(ToggleElement)];
