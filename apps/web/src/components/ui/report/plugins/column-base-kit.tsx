import { BaseColumnItemPlugin, BaseColumnPlugin } from '@platejs/layout';

import { ColumnElementStatic, ColumnGroupElementStatic } from '../elements/ColumnNodeStatic';

export const BaseColumnKit = [
  BaseColumnPlugin.withComponent(ColumnGroupElementStatic),
  BaseColumnItemPlugin.withComponent(ColumnElementStatic)
];
