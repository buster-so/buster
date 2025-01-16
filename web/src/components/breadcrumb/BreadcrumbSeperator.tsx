import React from 'react';
import { AppMaterialIcons } from '../icons';

export const BreadcrumbSeperator: React.FC<{
  style?: React.CSSProperties;
}> = React.memo(
  ({ style }) => <AppMaterialIcons style={style} size={16} icon="chevron_right" />,
  () => true
);
BreadcrumbSeperator.displayName = 'BreadcrumbSeperator';
