import {
  BaseTableCellHeaderPlugin,
  BaseTableCellPlugin,
  BaseTablePlugin,
  BaseTableRowPlugin
} from '@platejs/table';

import {
  TableCellElementStatic,
  TableCellHeaderElementStatic,
  TableElementStatic,
  TableRowElementStatic
} from '../elements/TableNodeStatic';

export const BaseTableKit = [
  BaseTablePlugin.withComponent(TableElementStatic),
  BaseTableRowPlugin.withComponent(TableRowElementStatic),
  BaseTableCellPlugin.withComponent(TableCellElementStatic),
  BaseTableCellHeaderPlugin.withComponent(TableCellHeaderElementStatic)
];
