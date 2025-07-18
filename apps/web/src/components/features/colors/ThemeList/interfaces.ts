import type { ColorPalette } from '@buster/server-shared/organization';

export type IColorTheme = ColorPalette & {
  selected?: boolean;
  hideThreeDotMenu?: boolean;
};
