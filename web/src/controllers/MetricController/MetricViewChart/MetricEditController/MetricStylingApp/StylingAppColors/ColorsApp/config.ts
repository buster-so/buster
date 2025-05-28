import { DEFAULT_CHART_THEME } from '@/api/asset_interfaces/metric/charts/configColors';
import {
  RAINBOW_THEME,
  SOFT_THEME,
  RED_YELLOW_BLUE_THEME,
  PASTEL_RAINBOW_THEME,
  BOLD_RAINBOW_THEME,
  VIBRANT_RAINBOW_THEME,
  CORPORATE_THEME,
  VIBRANT_JEWEL_TONES_THEME,
  VIBRANT_PASTEL_THEME,
  DIVERSE_DARK_PALETTE_BLACK_THEME,
  EMERALD_SPECTRUM_THEME,
  DIVERSE_DARK_PALETTE_GREEN_THEME,
  VIBRANT_RAINBOW,
  GREENS_THEME,
  BLUE_TO_ORANGE_GRADIENT,
  FOREST_LAKE_GRADIENT,
  MORE_BLUES_DARK_TO_LIGHT_THEME,
  PURPLE_THEME,
  ORANGE_THEME,
  RED_THEME,
  TEAL_THEME,
  BROWN_THEME,
  PINK_THEME,
  BLUE_THEME
} from '@/components/ui/charts/config/configColors';
import type { IColorTheme } from '../Common/interfaces';

export enum ColorAppSegments {
  Colorful = 'Colorful',
  Monochrome = 'Monochrome'
}

export const COLORFUL_THEMES: IColorTheme[] = [
  {
    name: 'Buster',
    colors: DEFAULT_CHART_THEME
  },
  {
    name: 'Rainbow',
    colors: RAINBOW_THEME
  },
  {
    name: 'Soft',
    colors: SOFT_THEME
  },
  {
    name: 'Red Yellow Blue',
    colors: RED_YELLOW_BLUE_THEME
  },
  {
    name: 'Pastel Rainbow',
    colors: PASTEL_RAINBOW_THEME
  },

  {
    name: 'Bold Rainbow',
    colors: BOLD_RAINBOW_THEME
  },
  {
    name: 'Modern',
    colors: VIBRANT_RAINBOW_THEME
  },
  {
    name: 'Corporate',
    colors: CORPORATE_THEME
  },
  {
    name: 'Jewel Tones',
    colors: VIBRANT_JEWEL_TONES_THEME
  },
  {
    name: 'Soft Pastel',
    colors: VIBRANT_PASTEL_THEME
  },
  {
    name: 'Diverse Dark',
    colors: DIVERSE_DARK_PALETTE_BLACK_THEME
  },
  {
    name: 'Emerald Spectrum',
    colors: EMERALD_SPECTRUM_THEME
  },
  {
    name: 'Forest Lake',
    colors: DIVERSE_DARK_PALETTE_GREEN_THEME
  },
  {
    name: 'Vibrant Rainbow',
    colors: VIBRANT_RAINBOW
  }
];

export const MONOCHROME_THEMES: IColorTheme[] = [
  {
    name: 'Greens',
    colors: GREENS_THEME
  },

  {
    name: 'Blue - Orange',
    colors: BLUE_TO_ORANGE_GRADIENT
  },
  {
    name: 'Forest Lake',
    colors: FOREST_LAKE_GRADIENT
  },
  {
    name: 'More Blues',
    colors: MORE_BLUES_DARK_TO_LIGHT_THEME
  },
  {
    name: 'Purple',
    colors: PURPLE_THEME
  },
  {
    name: 'Orange',
    colors: ORANGE_THEME
  },
  {
    name: 'Red',
    colors: RED_THEME
  },
  {
    name: 'Teal',
    colors: TEAL_THEME
  },
  {
    name: 'Brown',
    colors: BROWN_THEME
  },
  {
    name: 'Pink',
    colors: PINK_THEME
  },
  {
    name: 'Blue',
    colors: BLUE_THEME
  }
];
