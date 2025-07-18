import type { DEFAULT_COLOR_PALETTE_ID as DEFAULT_COLOR_PALETTE_ID_DATABASE } from '@buster/database';
import { DEFAULT_CHART_THEME } from '@buster/server-shared/metrics';

import type { ColorPalette } from '@buster/server-shared/organization';

export const DEFAULT_COLOR_PALETTE = DEFAULT_CHART_THEME;

const SOFT_THEME = [
  '#36A2EB', // Light Blue
  '#4BC0C0', // Soft Cyan
  '#9966FF', // Soft Purple
  '#FF9F40', // Soft Orange
  '#C9CBCF', // Light Grey
  '#66FF66', // Soft Green
  '#FF66B2', // Soft Pink
  '#66B2FF', // Soft Sky Blue
  '#FF6384', // Soft Red
  '#5C6BC0', // Indigo
];

const RAINBOW_THEME = [
  '#ff595e',
  '#ff924c',
  '#ffca3a',
  '#c5ca30',
  '#8ac926',
  '#36949d',
  '#1982c4',
  '#4267ac',
  '#565aa0',
  '#6a4c93',
];

const BOLD_RAINBOW_THEME = [
  '#ffcd00',
  '#faff98',
  '#bbdd00',
  '#5a8900',
  '#009c89',
  '#e31d04',
  '#ff7b83',
  '#ffa6a0',
  '#320e00',
];

const VIBRANT_RAINBOW_THEME = [
  '#9b5de5',
  '#c65ccd',
  '#f15bb5',
  '#f8a07b',
  '#fee440',
  '#7fd09d',
  '#00bbf9',
  '#00d8e7',
  '#00f5d4',
];

const CORPORATE_THEME = [
  '#73b7b8',
  '#52a1a3',
  '#76c8b1',
  '#50b99b',
  '#dc244b',
  '#af1d3c',
  '#f6cb52',
  '#f3b816',
  '#f05a29',
  '#d23f0f',
];

const EMERALD_SPECTRUM_THEME = [
  '#75F0A0',
  '#6FD5EC',
  '#6B69E8',
  '#D064E3',
  '#DD5F87',
  '#D7995B',
  '#A8D157',
  '#53CA67',
  '#50C3C3',
  '#4E60BC',
];

const VIBRANT_JEWEL_TONES_THEME = [
  '#F07589',
  '#EB6FEB',
  '#7F6BE6',
  '#67B7E0',
  '#63D99E',
  '#86D260',
  '#CBB85D',
  '#C25B5B',
  '#BA5AA8',
  '#7759B1',
];

const RED_YELLOW_BLUE_THEME = [
  '#f94144',
  '#f3722c',
  '#f8961e',
  '#f9844a',
  '#f9c74f',
  '#90be6d',
  '#43aa8b',
  '#4d908e',
  '#577590',
  '#277da1',
];

const PASTEL_RAINBOW_THEME = [
  '#ffadad',
  '#ffd6a5',
  '#fdffb6',
  '#caffbf',
  '#9bf6ff',
  '#a0c4ff',
  '#bdb2ff',
  '#ffc6ff',
  '#ffd1ff',
];

const DIVERSE_DARK_PALETTE_GREEN_THEME = [
  '#669900',
  '#99cc33',
  '#ccee66',
  '#006699',
  '#3399cc',
  '#990066',
  '#cc3399',
  '#ff6600',
  '#ff9900',
  '#ffcc00',
];

const DIVERSE_DARK_PALETTE_BLACK_THEME = [
  '#303638',
  '#f0c808',
  '#5d4b20',
  '#469374',
  '#9341b3',
  '#e3427d',
  '#e68653',
  '#ebe0b0',
  '#edfbba',
];

const VIBRANT_PASTEL_THEME = [
  '#F07575',
  '#ECD76F',
  '#93E869',
  '#64E3A3',
  '#5FB3DD',
  '#705BD7',
  '#D157D1',
  '#CA5367',
  '#C39B50',
  '#86BC4E',
];

const BLUE_TO_ORANGE_GRADIENT = [
  '#8ecae6',
  '#73bfdc',
  '#58b4d1',
  '#219ebc',
  '#126782',
  '#023047',
  '#ffb703',
  '#fd9e02',
  '#fb8500',
  '#fb9017',
];

const VIBRANT_RAINBOW = [
  '#F0DC75',
  '#98EC6F',
  '#69E8A8',
  '#64B8E3',
  '#745FDD',
  '#D75BD7',
  '#D1576B',
  '#CAA153',
  '#8CC350',
  '#4EBC70',
];

const FOREST_LAKE_GRADIENT = [
  '#40916c',
  '#52b788',
  '#74c69d',
  '#95d5b2',
  '#b7e4c7',
  '#89c2d9',
  '#61a5c2',
  '#468faf',
  '#2a6f97',
  '#013a63',
];

const GREENS_THEME = [
  '#99e2b4',
  '#88d4ab',
  '#78c6a3',
  '#67b99a',
  '#56ab91',
  '#469d89',
  '#358f80',
  '#248277',
  '#14746f',
  '#036666',
];

const MORE_BLUES_DARK_TO_LIGHT_THEME = [
  '#03045e',
  '#023e8a',
  '#0077b6',
  '#0096c7',
  '#00b4d8',
  '#48cae4',
  '#90e0ef',
  '#ade8f4',
  '#caf0f8',
  '#d5f3f9',
];

const PURPLE_THEME = [
  '#4a148c',
  '#6a1b9a',
  '#7b1fa2',
  '#8e24aa',
  '#9c27b0',
  '#ab47bc',
  '#ba68c8',
  '#ce93d8',
  '#e1bee7',
  '#f3e5f5',
];

const ORANGE_THEME = [
  '#e65100',
  '#ef6c00',
  '#f57c00',
  '#fb8c00',
  '#ff9800',
  '#ffa726',
  '#ffb74d',
  '#ffcc80',
  '#ffe0b2',
  '#fff3e0',
];

const RED_THEME = [
  '#b71c1c',
  '#c62828',
  '#d32f2f',
  '#e53935',
  '#f44336',
  '#ef5350',
  '#e57373',
  '#e35555',
  '#d13030',
  '#b71c1c',
];

const TEAL_THEME = [
  '#004d4d',
  '#006666',
  '#008080',
  '#009999',
  '#00b3b3',
  '#00cccc',
  '#00b3b3',
  '#009999',
  '#008080',
  '#006666',
];

const BLUE_THEME = [
  '#0d47a1',
  '#1565c0',
  '#1976d2',
  '#1e88e5',
  '#2196f3',
  '#42a5f5',
  '#2196f3',
  '#1976d2',
  '#1565c0',
  '#0d47a1',
];

const BROWN_THEME = [
  '#3e2723',
  '#4e342e',
  '#5d4037',
  '#6d4c41',
  '#795548',
  '#8d6e63',
  '#795548',
  '#6d4c41',
  '#5d4037',
  '#4e342e',
];

const PINK_THEME = [
  '#880e4f',
  '#ad1457',
  '#c2185b',
  '#d81b60',
  '#e91e63',
  '#ec407a',
  '#e91e63',
  '#d81b60',
  '#c2185b',
  '#ad1457',
];

export const DEFAULT_COLOR_PALETTE_ID: typeof DEFAULT_COLOR_PALETTE_ID_DATABASE = '__DEFAULT__';

const createDefaultId = (name: string, index: number) => {
  return `${DEFAULT_COLOR_PALETTE_ID}${name.toLowerCase().replace(/ /g, '-')}-${index}`;
};

export const COLORFUL_THEMES = [
  {
    name: 'Buster',
    colors: DEFAULT_COLOR_PALETTE,
  },
  {
    name: 'Rainbow',
    colors: RAINBOW_THEME,
  },
  {
    name: 'Soft',
    colors: SOFT_THEME,
  },
  {
    name: 'Red Yellow Blue',
    colors: RED_YELLOW_BLUE_THEME,
  },
  {
    name: 'Pastel Rainbow',
    colors: PASTEL_RAINBOW_THEME,
  },

  {
    name: 'Bold Rainbow',
    colors: BOLD_RAINBOW_THEME,
  },
  {
    name: 'Modern',
    colors: VIBRANT_RAINBOW_THEME,
  },
  {
    name: 'Corporate',
    colors: CORPORATE_THEME,
  },
  {
    name: 'Jewel Tones',
    colors: VIBRANT_JEWEL_TONES_THEME,
  },
  {
    name: 'Soft Pastel',
    colors: VIBRANT_PASTEL_THEME,
  },
  {
    name: 'Diverse Dark',
    colors: DIVERSE_DARK_PALETTE_BLACK_THEME,
  },
  {
    name: 'Emerald Spectrum',
    colors: EMERALD_SPECTRUM_THEME,
  },
  {
    name: 'Deep Forest',
    colors: DIVERSE_DARK_PALETTE_GREEN_THEME,
  },
  {
    name: 'Vibrant Rainbow',
    colors: VIBRANT_RAINBOW,
  },
].map((theme, index) => ({
  ...theme,
  id: createDefaultId(theme.name, index),
}));

export const MONOCHROME_THEMES = [
  {
    name: 'Greens',
    colors: GREENS_THEME,
  },

  {
    name: 'Blue - Orange',
    colors: BLUE_TO_ORANGE_GRADIENT,
  },
  {
    name: 'Forest Sunset',
    colors: FOREST_LAKE_GRADIENT,
  },
  {
    name: 'More Blues',
    colors: MORE_BLUES_DARK_TO_LIGHT_THEME,
  },
  {
    name: 'Purple',
    colors: PURPLE_THEME,
  },
  {
    name: 'Orange',
    colors: ORANGE_THEME,
  },
  {
    name: 'Red',
    colors: RED_THEME,
  },
  {
    name: 'Teal',
    colors: TEAL_THEME,
  },
  {
    name: 'Brown',
    colors: BROWN_THEME,
  },
  {
    name: 'Pink',
    colors: PINK_THEME,
  },
  {
    name: 'Blue',
    colors: BLUE_THEME,
  },
].map((theme, index) => ({
  ...theme,
  id: createDefaultId(theme.name, index),
}));

export const ALL_THEMES: ColorPalette[] = [...COLORFUL_THEMES, ...MONOCHROME_THEMES];

export const ALL_DICTIONARY_THEMES: ColorPalette[] = ALL_THEMES;
